from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Optional, List
import enum

app = FastAPI(title="PerformAI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "performai-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480

SQLALCHEMY_DATABASE_URL = "sqlite:///./performai.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class RoleEnum(str, enum.Enum):
    employee = "employee"
    manager = "manager"
    hr_admin = "hr_admin"
    finance = "finance"

class PulseEnum(str, enum.Enum):
    on_track = "on_track"
    needs_attention = "needs_attention"
    at_risk = "at_risk"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    department = Column(String)
    manager_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    kpis = relationship("KPI", back_populates="employee", foreign_keys="KPI.employee_id")

class KPI(Base):
    __tablename__ = "kpis"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    employee_id = Column(Integer, ForeignKey("users.id"))
    manager_id = Column(Integer, ForeignKey("users.id"))
    cycle_year = Column(Integer, default=datetime.now().year)
    created_at = Column(DateTime, default=datetime.utcnow)
    employee = relationship("User", back_populates="kpis", foreign_keys=[employee_id])

class Achievement(Base):
    __tablename__ = "achievements"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    kpi_id = Column(Integer, ForeignKey("kpis.id"))
    description = Column(Text, nullable=False)
    month = Column(Integer)
    year = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class MonthlyPulse(Base):
    __tablename__ = "monthly_pulses"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    manager_id = Column(Integer, ForeignKey("users.id"))
    status = Column(Enum(PulseEnum))
    comments = Column(Text)
    month = Column(Integer)
    year = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)

class Appraisal(Base):
    __tablename__ = "appraisals"
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"))
    manager_id = Column(Integer, ForeignKey("users.id"))
    cycle_year = Column(Integer)
    self_summary = Column(Text)
    manager_rating = Column(Integer)
    next_step = Column(String)
    employee_signed = Column(String)
    manager_signed = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: RoleEnum
    department: Optional[str] = None
    manager_id: Optional[int] = None

class KPICreate(BaseModel):
    title: str
    description: Optional[str] = None
    employee_id: int

class AchievementCreate(BaseModel):
    kpi_id: int
    description: str
    month: int
    year: int

class PulseCreate(BaseModel):
    employee_id: int
    status: PulseEnum
    comments: Optional[str] = None
    month: int
    year: int

class AppraisalCreate(BaseModel):
    employee_id: int
    cycle_year: int
    self_summary: Optional[str] = None
    manager_rating: Optional[int] = None
    next_step: Optional[str] = None

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "name": user.name, "id": user.id}

@app.post("/users")
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    db_user = User(
        name=user.name, email=user.email,
        hashed_password=get_password_hash(user.password),
        role=user.role, department=user.department, manager_id=user.manager_id
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"id": db_user.id, "name": db_user.name, "email": db_user.email, "role": db_user.role}

@app.get("/users")
async def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [RoleEnum.hr_admin, RoleEnum.manager]:
        raise HTTPException(status_code=403, detail="Not authorized")
    users = db.query(User).all()
    return [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "department": u.department} for u in users]

@app.get("/users/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name, "email": current_user.email, "role": current_user.role, "department": current_user.department}

@app.post("/kpis")
async def create_kpi(kpi: KPICreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [RoleEnum.manager, RoleEnum.hr_admin]:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_kpi = KPI(title=kpi.title, description=kpi.description, employee_id=kpi.employee_id, manager_id=current_user.id)
    db.add(db_kpi)
    db.commit()
    db.refresh(db_kpi)
    return db_kpi

@app.get("/kpis/{employee_id}")
async def get_kpis(employee_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kpis = db.query(KPI).filter(KPI.employee_id == employee_id).all()
    return kpis

@app.post("/achievements")
async def create_achievement(achievement: AchievementCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_ach = Achievement(employee_id=current_user.id, kpi_id=achievement.kpi_id,
                         description=achievement.description, month=achievement.month, year=achievement.year)
    db.add(db_ach)
    db.commit()
    db.refresh(db_ach)
    return db_ach

@app.get("/achievements/{employee_id}")
async def get_achievements(employee_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Achievement).filter(Achievement.employee_id == employee_id).all()

@app.post("/pulse")
async def create_pulse(pulse: PulseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [RoleEnum.manager, RoleEnum.hr_admin]:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_pulse = MonthlyPulse(employee_id=pulse.employee_id, manager_id=current_user.id,
                            status=pulse.status, comments=pulse.comments, month=pulse.month, year=pulse.year)
    db.add(db_pulse)
    db.commit()
    db.refresh(db_pulse)
    return db_pulse

@app.get("/pulse/{employee_id}")
async def get_pulse(employee_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(MonthlyPulse).filter(MonthlyPulse.employee_id == employee_id).all()

@app.post("/appraisals")
async def create_appraisal(appraisal: AppraisalCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db_app = Appraisal(employee_id=appraisal.employee_id, manager_id=current_user.id,
                       cycle_year=appraisal.cycle_year, self_summary=appraisal.self_summary,
                       manager_rating=appraisal.manager_rating, next_step=appraisal.next_step)
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@app.get("/appraisals/{employee_id}")
async def get_appraisals(employee_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Appraisal).filter(Appraisal.employee_id == employee_id).all()

@app.get("/dashboard/summary")
async def get_dashboard(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in [RoleEnum.hr_admin, RoleEnum.finance]:
        raise HTTPException(status_code=403, detail="Not authorized")
    total_users = db.query(User).count()
    total_kpis = db.query(KPI).count()
    total_appraisals = db.query(Appraisal).count()
    at_risk = db.query(MonthlyPulse).filter(MonthlyPulse.status == PulseEnum.at_risk).count()
    return {"total_employees": total_users, "total_kpis": total_kpis, "total_appraisals": total_appraisals, "at_risk_count": at_risk}