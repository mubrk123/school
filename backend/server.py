from fastapi import FastAPI, APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func, delete
from sqlalchemy.orm import selectinload
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, date, timedelta
import jwt
from passlib.context import CryptContext

from database import get_db, engine, Base
from models import School, User, Student, FeeBill, StudentFee, Attendance, Notification, TeacherSalary

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'schoolify-secret-key')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

app = FastAPI(title="School Administration API")
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ========================
# Pydantic Schemas
# ========================

class SchoolCreate(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None

class SchoolRegisterRequest(BaseModel):
    school_name: str
    school_address: Optional[str] = None
    school_phone: Optional[str] = None
    school_email: Optional[str] = None
    user_name: str
    user_email: EmailStr
    user_password: str

class SchoolResponse(BaseModel):
    id: str
    name: str
    address: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "teacher"
    phone: Optional[str] = None
    address: Optional[str] = None
    assigned_classes: Optional[List[str]] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    school_id: str
    email: str
    name: str
    role: str
    phone: Optional[str] = None
    address: Optional[str] = None
    assigned_classes: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class TeacherCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    assigned_classes: List[str]

class TeacherSalaryCreate(BaseModel):
    teacher_id: str
    amount: float
    remark: Optional[str] = None

class TeacherSalaryResponse(BaseModel):
    id: str
    teacher_id: str
    amount: float
    remark: Optional[str]
    paid_by: Optional[str]
    paid_at: datetime
    created_at: datetime
    teacher_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    school: SchoolResponse

class StudentCreate(BaseModel):
    class_name: str
    admission_number: str
    name: str
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    parent_contact: str
    parent_email: Optional[str] = None
    date_of_admission: date

class StudentUpdate(BaseModel):
    class_name: Optional[str] = None
    name: Optional[str] = None
    father_name: Optional[str] = None
    mother_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    address: Optional[str] = None
    parent_contact: Optional[str] = None
    parent_email: Optional[str] = None
    is_active: Optional[bool] = None

class StudentResponse(BaseModel):
    id: str
    school_id: str
    class_name: str
    admission_number: str
    name: str
    father_name: Optional[str]
    mother_name: Optional[str]
    date_of_birth: Optional[date]
    gender: Optional[str]
    address: Optional[str]
    parent_contact: str
    parent_email: Optional[str]
    date_of_admission: date
    is_active: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class FeeBillCreate(BaseModel):
    name: str
    amount: float
    description: Optional[str] = None
    target_class: Optional[str] = None
    due_date: Optional[date] = None

class FeeBillResponse(BaseModel):
    id: str
    school_id: str
    name: str
    amount: float
    description: Optional[str]
    target_class: Optional[str]
    due_date: Optional[date]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class StudentFeeResponse(BaseModel):
    id: str
    student_id: str
    fee_bill_id: str
    amount: float
    status: str
    paid_at: Optional[datetime]
    marked_by: Optional[str]
    remarks: Optional[str]
    created_at: datetime
    student_name: Optional[str] = None
    student_class: Optional[str] = None
    fee_bill_name: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class MarkFeesPaid(BaseModel):
    remarks: Optional[str] = None

class AttendanceCreate(BaseModel):
    student_id: str
    status: str  # present, absent

class AttendanceBulkCreate(BaseModel):
    date: date
    records: List[AttendanceCreate]

class AttendanceResponse(BaseModel):
    id: str
    student_id: str
    date: date
    status: str
    marked_by: Optional[str]
    created_at: datetime
    student_name: Optional[str] = None
    student_class: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class NotificationCreate(BaseModel):
    title: str
    message: str
    target_class: Optional[str] = None

class NotificationResponse(BaseModel):
    id: str
    school_id: str
    title: str
    message: str
    target_class: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class DashboardStats(BaseModel):
    total_students: int
    total_classes: int
    pending_fees: int
    today_attendance_rate: float
    recent_admissions: int

# ========================
# Helper Functions
# ========================

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_principal(user: User = Depends(get_current_user)) -> User:
    if user.role != "principal":
        raise HTTPException(status_code=403, detail="Principal access required")
    return user

# ========================
# Auth Routes
# ========================

@api_router.post("/auth/register-school", response_model=TokenResponse)
async def register_school(data: SchoolRegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register a new school with a principal account"""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == data.user_email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create school
    school = School(
        name=data.school_name,
        address=data.school_address,
        phone=data.school_phone,
        email=data.school_email
    )
    db.add(school)
    await db.flush()
    
    # Create principal user
    user = User(
        school_id=school.id,
        email=data.user_email,
        password_hash=hash_password(data.user_password),
        name=data.user_name,
        role="principal"
    )
    db.add(user)
    await db.commit()
    await db.refresh(school)
    await db.refresh(user)
    
    token = create_access_token({"user_id": user.id, "school_id": school.id, "role": user.role})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
        school=SchoolResponse.model_validate(school)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(data: UserLogin, db: AsyncSession = Depends(get_db)):
    """Login user"""
    result = await db.execute(
        select(User).options(selectinload(User.school)).where(User.email == data.email)
    )
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token({"user_id": user.id, "school_id": user.school_id, "role": user.role})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
        school=SchoolResponse.model_validate(user.school)
    )

@api_router.get("/auth/me", response_model=TokenResponse)
async def get_me(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get current user info"""
    result = await db.execute(select(School).where(School.id == user.school_id))
    school = result.scalar_one()
    
    token = create_access_token({"user_id": user.id, "school_id": user.school_id, "role": user.role})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
        school=SchoolResponse.model_validate(school)
    )

# ========================
# User Management Routes
# ========================

@api_router.post("/users", response_model=UserResponse)
async def create_user(data: UserCreate, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Create a new user (teacher) - Principal only"""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    assigned_classes_str = ','.join(data.assigned_classes) if data.assigned_classes else None
    
    new_user = User(
        school_id=user.school_id,
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        phone=data.phone,
        address=data.address,
        assigned_classes=assigned_classes_str,
        role=data.role if data.role in ["teacher", "principal"] else "teacher"
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return UserResponse.model_validate(new_user)

@api_router.post("/teachers", response_model=UserResponse)
async def create_teacher(data: TeacherCreate, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Create a new teacher with assigned classes - Principal only"""
    # Check if email exists
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already exists")
    
    assigned_classes_str = ','.join(data.assigned_classes) if data.assigned_classes else None
    
    new_teacher = User(
        school_id=user.school_id,
        email=data.email,
        password_hash=hash_password(data.password),
        name=data.name,
        phone=data.phone,
        address=data.address,
        assigned_classes=assigned_classes_str,
        role="teacher"
    )
    db.add(new_teacher)
    await db.commit()
    await db.refresh(new_teacher)
    return UserResponse.model_validate(new_teacher)

@api_router.get("/teachers", response_model=List[UserResponse])
async def get_teachers(user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Get all teachers in the school - Principal only"""
    result = await db.execute(
        select(User).where(and_(User.school_id == user.school_id, User.role == "teacher"))
    )
    teachers = result.scalars().all()
    return [UserResponse.model_validate(t) for t in teachers]

@api_router.get("/teachers/{teacher_id}", response_model=UserResponse)
async def get_teacher(teacher_id: str, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Get a specific teacher - Principal only"""
    result = await db.execute(
        select(User).where(and_(User.id == teacher_id, User.school_id == user.school_id, User.role == "teacher"))
    )
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return UserResponse.model_validate(teacher)

@api_router.put("/teachers/{teacher_id}", response_model=UserResponse)
async def update_teacher(teacher_id: str, data: TeacherCreate, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Update a teacher - Principal only"""
    result = await db.execute(
        select(User).where(and_(User.id == teacher_id, User.school_id == user.school_id, User.role == "teacher"))
    )
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    teacher.name = data.name
    teacher.phone = data.phone
    teacher.address = data.address
    teacher.assigned_classes = ','.join(data.assigned_classes) if data.assigned_classes else None
    if data.password:
        teacher.password_hash = hash_password(data.password)
    
    await db.commit()
    await db.refresh(teacher)
    return UserResponse.model_validate(teacher)

# ========================
# Teacher Salary Routes
# ========================

@api_router.post("/teacher-salaries", response_model=TeacherSalaryResponse)
async def create_teacher_salary(data: TeacherSalaryCreate, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Record a salary payment to a teacher - Principal only"""
    # Verify teacher exists in same school
    result = await db.execute(
        select(User).where(and_(User.id == data.teacher_id, User.school_id == user.school_id, User.role == "teacher"))
    )
    teacher = result.scalar_one_or_none()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    salary = TeacherSalary(
        teacher_id=data.teacher_id,
        amount=data.amount,
        remark=data.remark,
        paid_by=user.id,
        paid_at=datetime.now(timezone.utc)
    )
    db.add(salary)
    await db.commit()
    await db.refresh(salary)
    
    response = TeacherSalaryResponse.model_validate(salary)
    response.teacher_name = teacher.name
    return response

@api_router.get("/teacher-salaries", response_model=List[TeacherSalaryResponse])
async def get_all_salaries(user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Get all salary payments - Principal only"""
    result = await db.execute(
        select(TeacherSalary).options(selectinload(TeacherSalary.teacher)).join(User).where(
            User.school_id == user.school_id
        ).order_by(TeacherSalary.paid_at.desc())
    )
    salaries = result.scalars().all()
    
    response = []
    for salary in salaries:
        s = TeacherSalaryResponse.model_validate(salary)
        s.teacher_name = salary.teacher.name if salary.teacher else None
        response.append(s)
    return response

@api_router.get("/teachers/{teacher_id}/salaries", response_model=List[TeacherSalaryResponse])
async def get_teacher_salaries(teacher_id: str, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Get salary history for a specific teacher - Principal only"""
    result = await db.execute(
        select(TeacherSalary).options(selectinload(TeacherSalary.teacher)).where(
            TeacherSalary.teacher_id == teacher_id
        ).order_by(TeacherSalary.paid_at.desc())
    )
    salaries = result.scalars().all()
    
    response = []
    for salary in salaries:
        s = TeacherSalaryResponse.model_validate(salary)
        s.teacher_name = salary.teacher.name if salary.teacher else None
        response.append(s)
    return response


@api_router.get("/users", response_model=List[UserResponse])
async def get_users(user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Get all users in the school - Principal only"""
    result = await db.execute(select(User).where(User.school_id == user.school_id))
    users = result.scalars().all()
    return [UserResponse.model_validate(u) for u in users]

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Delete a user - Principal only"""
    if user_id == user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.execute(select(User).where(and_(User.id == user_id, User.school_id == user.school_id)))
    target_user = result.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.delete(target_user)
    await db.commit()
    return {"message": "User deleted"}

# ========================
# Student Routes
# ========================

@api_router.post("/students", response_model=StudentResponse)
async def create_student(data: StudentCreate, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Create a new student - Principal only"""
    student = Student(school_id=user.school_id, **data.model_dump())
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return StudentResponse.model_validate(student)

@api_router.get("/students", response_model=List[StudentResponse])
async def get_students(
    class_name: Optional[str] = None,
    search: Optional[str] = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get all students in the school"""
    query = select(Student).where(and_(Student.school_id == user.school_id, Student.is_active == True))
    
    if class_name:
        query = query.where(Student.class_name == class_name)
    
    if search:
        query = query.where(Student.name.ilike(f"%{search}%"))
    
    query = query.order_by(Student.class_name, Student.name)
    result = await db.execute(query)
    students = result.scalars().all()
    return [StudentResponse.model_validate(s) for s in students]

@api_router.get("/students/{student_id}", response_model=StudentResponse)
async def get_student(student_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get a single student"""
    result = await db.execute(
        select(Student).where(and_(Student.id == student_id, Student.school_id == user.school_id))
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentResponse.model_validate(student)

@api_router.put("/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, data: StudentUpdate, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Update a student - Principal only"""
    result = await db.execute(
        select(Student).where(and_(Student.id == student_id, Student.school_id == user.school_id))
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(student, key, value)
    
    await db.commit()
    await db.refresh(student)
    return StudentResponse.model_validate(student)

@api_router.delete("/students/{student_id}")
async def delete_student(student_id: str, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Delete a student - Principal only"""
    result = await db.execute(
        select(Student).where(and_(Student.id == student_id, Student.school_id == user.school_id))
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    await db.delete(student)
    await db.commit()
    return {"message": "Student deleted"}

# ========================
# Fee Management Routes
# ========================

@api_router.post("/fee-bills", response_model=FeeBillResponse)
async def create_fee_bill(data: FeeBillCreate, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Create a new fee bill and assign to students - Principal only"""
    fee_bill = FeeBill(school_id=user.school_id, **data.model_dump())
    db.add(fee_bill)
    await db.flush()
    
    # Get students to assign fee
    query = select(Student).where(and_(Student.school_id == user.school_id, Student.is_active == True))
    if data.target_class:
        query = query.where(Student.class_name == data.target_class)
    
    result = await db.execute(query)
    students = result.scalars().all()
    
    # Create student fee records
    for student in students:
        student_fee = StudentFee(
            student_id=student.id,
            fee_bill_id=fee_bill.id,
            amount=data.amount,
            status="unpaid"
        )
        db.add(student_fee)
    
    await db.commit()
    await db.refresh(fee_bill)
    return FeeBillResponse.model_validate(fee_bill)

@api_router.get("/fee-bills", response_model=List[FeeBillResponse])
async def get_fee_bills(user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Get all fee bills - Principal only"""
    result = await db.execute(
        select(FeeBill).where(FeeBill.school_id == user.school_id).order_by(FeeBill.created_at.desc())
    )
    bills = result.scalars().all()
    return [FeeBillResponse.model_validate(b) for b in bills]

@api_router.get("/fee-bills/{fee_bill_id}/students", response_model=List[StudentFeeResponse])
async def get_fee_bill_students(fee_bill_id: str, status: Optional[str] = None, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Get students for a fee bill with their payment status - Principal only"""
    query = select(StudentFee).options(
        selectinload(StudentFee.student),
        selectinload(StudentFee.fee_bill)
    ).where(StudentFee.fee_bill_id == fee_bill_id)
    
    if status:
        query = query.where(StudentFee.status == status)
    
    result = await db.execute(query)
    fees = result.scalars().all()
    
    response = []
    for fee in fees:
        fee_data = StudentFeeResponse.model_validate(fee)
        fee_data.student_name = fee.student.name if fee.student else None
        fee_data.student_class = fee.student.class_name if fee.student else None
        fee_data.fee_bill_name = fee.fee_bill.name if fee.fee_bill else None
        response.append(fee_data)
    
    return response

@api_router.put("/student-fees/{fee_id}/mark-paid", response_model=StudentFeeResponse)
async def mark_fee_paid(fee_id: str, data: MarkFeesPaid, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Mark a student fee as paid - Principal only (cannot be undone)"""
    result = await db.execute(
        select(StudentFee).options(
            selectinload(StudentFee.student),
            selectinload(StudentFee.fee_bill)
        ).where(StudentFee.id == fee_id)
    )
    fee = result.scalar_one_or_none()
    
    if not fee:
        raise HTTPException(status_code=404, detail="Fee record not found")
    
    if fee.status == "paid":
        raise HTTPException(status_code=400, detail="Fee is already marked as paid")
    
    fee.status = "paid"
    fee.paid_at = datetime.now(timezone.utc)
    fee.marked_by = user.id
    fee.remarks = data.remarks
    
    await db.commit()
    await db.refresh(fee)
    
    fee_data = StudentFeeResponse.model_validate(fee)
    fee_data.student_name = fee.student.name if fee.student else None
    fee_data.student_class = fee.student.class_name if fee.student else None
    fee_data.fee_bill_name = fee.fee_bill.name if fee.fee_bill else None
    return fee_data

@api_router.get("/students/{student_id}/fees", response_model=List[StudentFeeResponse])
async def get_student_fees(student_id: str, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get fee history for a student"""
    result = await db.execute(
        select(StudentFee).options(
            selectinload(StudentFee.student),
            selectinload(StudentFee.fee_bill)
        ).where(StudentFee.student_id == student_id).order_by(StudentFee.created_at.desc())
    )
    fees = result.scalars().all()
    
    response = []
    for fee in fees:
        fee_data = StudentFeeResponse.model_validate(fee)
        fee_data.student_name = fee.student.name if fee.student else None
        fee_data.student_class = fee.student.class_name if fee.student else None
        fee_data.fee_bill_name = fee.fee_bill.name if fee.fee_bill else None
        response.append(fee_data)
    
    return response

# ========================
# Attendance Routes
# ========================

@api_router.post("/attendance", response_model=List[AttendanceResponse])
async def mark_attendance(data: AttendanceBulkCreate, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Mark attendance for multiple students"""
    responses = []
    
    for record in data.records:
        # Check if attendance already exists for this date
        result = await db.execute(
            select(Attendance).where(
                and_(Attendance.student_id == record.student_id, Attendance.date == data.date)
            )
        )
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.status = record.status
            existing.marked_by = user.id
            attendance = existing
        else:
            attendance = Attendance(
                student_id=record.student_id,
                date=data.date,
                status=record.status,
                marked_by=user.id
            )
            db.add(attendance)
        
        await db.flush()
        await db.refresh(attendance)
        responses.append(AttendanceResponse.model_validate(attendance))
    
    await db.commit()
    return responses

@api_router.get("/attendance", response_model=List[AttendanceResponse])
async def get_attendance(
    date: date,
    class_name: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get attendance for a class on a specific date"""
    result = await db.execute(
        select(Attendance).options(selectinload(Attendance.student)).join(Student).where(
            and_(
                Attendance.date == date,
                Student.class_name == class_name,
                Student.school_id == user.school_id
            )
        )
    )
    records = result.scalars().all()
    
    response = []
    for record in records:
        att_data = AttendanceResponse.model_validate(record)
        att_data.student_name = record.student.name if record.student else None
        att_data.student_class = record.student.class_name if record.student else None
        response.append(att_data)
    
    return response

@api_router.get("/students/{student_id}/attendance", response_model=List[AttendanceResponse])
async def get_student_attendance(student_id: str, days: int = 60, user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get attendance history for a student (last N days)"""
    start_date = date.today() - timedelta(days=days)
    
    result = await db.execute(
        select(Attendance).options(selectinload(Attendance.student)).where(
            and_(Attendance.student_id == student_id, Attendance.date >= start_date)
        ).order_by(Attendance.date.desc())
    )
    records = result.scalars().all()
    
    response = []
    for record in records:
        att_data = AttendanceResponse.model_validate(record)
        att_data.student_name = record.student.name if record.student else None
        att_data.student_class = record.student.class_name if record.student else None
        response.append(att_data)
    
    return response

# ========================
# Notification Routes
# ========================

@api_router.post("/notifications", response_model=NotificationResponse)
async def create_notification(data: NotificationCreate, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Create a notification - Principal only"""
    notification = Notification(
        school_id=user.school_id,
        created_by=user.id,
        **data.model_dump()
    )
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return NotificationResponse.model_validate(notification)

@api_router.get("/notifications", response_model=List[NotificationResponse])
async def get_notifications(user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Get all notifications - Principal only"""
    result = await db.execute(
        select(Notification).where(Notification.school_id == user.school_id).order_by(Notification.created_at.desc())
    )
    notifications = result.scalars().all()
    return [NotificationResponse.model_validate(n) for n in notifications]

@api_router.get("/notifications/{notification_id}/contacts")
async def get_notification_contacts(notification_id: str, user: User = Depends(require_principal), db: AsyncSession = Depends(get_db)):
    """Get WhatsApp contacts for a notification"""
    result = await db.execute(select(Notification).where(Notification.id == notification_id))
    notification = result.scalar_one_or_none()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    query = select(Student).where(and_(Student.school_id == user.school_id, Student.is_active == True))
    if notification.target_class:
        query = query.where(Student.class_name == notification.target_class)
    
    result = await db.execute(query)
    students = result.scalars().all()
    
    contacts = []
    for student in students:
        phone = student.parent_contact.replace(" ", "").replace("-", "")
        if not phone.startswith("+"):
            phone = "+91" + phone  # Default to India
        
        message = f"*{notification.title}*\n\n{notification.message}\n\n- {user.school_id}"
        wa_link = f"https://wa.me/{phone.replace('+', '')}?text={message}"
        
        contacts.append({
            "student_name": student.name,
            "parent_contact": student.parent_contact,
            "whatsapp_link": wa_link
        })
    
    return {"notification": NotificationResponse.model_validate(notification), "contacts": contacts}

# ========================
# Dashboard Routes
# ========================

@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """Get dashboard statistics"""
    # Total students
    result = await db.execute(
        select(func.count(Student.id)).where(
            and_(Student.school_id == user.school_id, Student.is_active == True)
        )
    )
    total_students = result.scalar() or 0
    
    # Total classes (distinct)
    result = await db.execute(
        select(func.count(func.distinct(Student.class_name))).where(
            and_(Student.school_id == user.school_id, Student.is_active == True)
        )
    )
    total_classes = result.scalar() or 0
    
    # Pending fees
    result = await db.execute(
        select(func.count(StudentFee.id)).join(Student).where(
            and_(Student.school_id == user.school_id, StudentFee.status == "unpaid")
        )
    )
    pending_fees = result.scalar() or 0
    
    # Today's attendance rate
    today = date.today()
    result = await db.execute(
        select(func.count(Attendance.id)).join(Student).where(
            and_(Student.school_id == user.school_id, Attendance.date == today, Attendance.status == "present")
        )
    )
    present_count = result.scalar() or 0
    
    result = await db.execute(
        select(func.count(Attendance.id)).join(Student).where(
            and_(Student.school_id == user.school_id, Attendance.date == today)
        )
    )
    total_attendance = result.scalar() or 0
    
    attendance_rate = (present_count / total_attendance * 100) if total_attendance > 0 else 0
    
    # Recent admissions (last 30 days)
    thirty_days_ago = date.today() - timedelta(days=30)
    result = await db.execute(
        select(func.count(Student.id)).where(
            and_(
                Student.school_id == user.school_id,
                Student.is_active == True,
                Student.date_of_admission >= thirty_days_ago
            )
        )
    )
    recent_admissions = result.scalar() or 0
    
    return DashboardStats(
        total_students=total_students,
        total_classes=total_classes,
        pending_fees=pending_fees,
        today_attendance_rate=round(attendance_rate, 1),
        recent_admissions=recent_admissions
    )

@api_router.get("/classes")
async def get_classes(user: User = Depends(get_current_user)):
    """Get list of all classes"""
    return {"classes": [f"Class {i}" for i in range(1, 13)]}

# Health check
@api_router.get("/")
async def root():
    return {"message": "School Administration API", "status": "healthy"}

@api_router.get("/health")
async def health():
    return {"status": "ok"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown():
    await engine.dispose()
