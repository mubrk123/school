import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Integer, Boolean, Float, Date, Index
from sqlalchemy.orm import relationship
from database import Base

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class School(Base):
    __tablename__ = 'schools'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    address = Column(Text)
    phone = Column(String(20))
    email = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    users = relationship('User', back_populates='school', cascade='all, delete-orphan')
    students = relationship('Student', back_populates='school', cascade='all, delete-orphan')
    fee_bills = relationship('FeeBill', back_populates='school', cascade='all, delete-orphan')
    notifications = relationship('Notification', back_populates='school', cascade='all, delete-orphan')

class User(Base):
    __tablename__ = 'users'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey('schools.id', ondelete='CASCADE'), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default='teacher')  # principal, teacher
    phone = Column(String(20))
    address = Column(Text)
    assigned_classes = Column(Text)  # Comma-separated class names for teachers
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    school = relationship('School', back_populates='users')
    salary_payments = relationship('TeacherSalary', back_populates='teacher', cascade='all, delete-orphan', foreign_keys='TeacherSalary.teacher_id')
    
    __table_args__ = (
        Index('idx_user_school_email', 'school_id', 'email', unique=True),
    )

class Student(Base):
    __tablename__ = 'students'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey('schools.id', ondelete='CASCADE'), nullable=False, index=True)
    class_name = Column(String(50), nullable=False, index=True)  # Class 1, Class 2, etc.
    admission_number = Column(String(50), nullable=False)
    name = Column(String(255), nullable=False)
    father_name = Column(String(255))
    mother_name = Column(String(255))
    date_of_birth = Column(Date)
    gender = Column(String(10))
    address = Column(Text)
    parent_contact = Column(String(20), nullable=False)
    parent_email = Column(String(255))
    date_of_admission = Column(Date, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    school = relationship('School', back_populates='students')
    fees = relationship('StudentFee', back_populates='student', cascade='all, delete-orphan')
    attendance_records = relationship('Attendance', back_populates='student', cascade='all, delete-orphan')
    
    __table_args__ = (
        Index('idx_student_school_admission', 'school_id', 'admission_number', unique=True),
    )

class FeeBill(Base):
    __tablename__ = 'fee_bills'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey('schools.id', ondelete='CASCADE'), nullable=False, index=True)
    name = Column(String(255), nullable=False)  # Monthly Fee, Registration Fee, etc.
    amount = Column(Float, nullable=False)
    description = Column(Text)
    target_class = Column(String(50))  # null means all classes
    due_date = Column(Date)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    school = relationship('School', back_populates='fee_bills')
    student_fees = relationship('StudentFee', back_populates='fee_bill', cascade='all, delete-orphan')

class StudentFee(Base):
    __tablename__ = 'student_fees'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    fee_bill_id = Column(String(36), ForeignKey('fee_bills.id', ondelete='CASCADE'), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    status = Column(String(20), default='unpaid', index=True)  # paid, unpaid
    paid_at = Column(DateTime(timezone=True))
    marked_by = Column(String(36))  # user_id who marked as paid
    remarks = Column(Text)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    student = relationship('Student', back_populates='fees')
    fee_bill = relationship('FeeBill', back_populates='student_fees')
    
    __table_args__ = (
        Index('idx_student_fee_unique', 'student_id', 'fee_bill_id', unique=True),
    )

class Attendance(Base):
    __tablename__ = 'attendance'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    student_id = Column(String(36), ForeignKey('students.id', ondelete='CASCADE'), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    status = Column(String(10), nullable=False)  # present, absent
    marked_by = Column(String(36))  # user_id
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    student = relationship('Student', back_populates='attendance_records')
    
    __table_args__ = (
        Index('idx_attendance_student_date', 'student_id', 'date', unique=True),
    )

class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    school_id = Column(String(36), ForeignKey('schools.id', ondelete='CASCADE'), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    target_class = Column(String(50))  # null means all classes
    created_by = Column(String(36))  # user_id
    created_at = Column(DateTime(timezone=True), default=utc_now)
    
    school = relationship('School', back_populates='notifications')
