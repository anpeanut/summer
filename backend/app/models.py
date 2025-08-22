from app import db
from datetime import datetime
from sqlalchemy.dialects.postgresql import JSONB

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), index=True, unique=True, nullable=False)
    email = db.Column(db.String(120), index=True, unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<User {self.username}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# 添加更多模型...
class Country(db.Model):
    __tablename__ = 'countries'
    
    id = db.Column(db.String(2), primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    population = db.Column(db.BigInteger, nullable=False)
    capital = db.Column(db.String(50), nullable=False)
    longitude = db.Column(db.Numeric(9,6), nullable=False)
    latitude = db.Column(db.Numeric(9,6), nullable=False)
    data_completeness = db.Column(db.Numeric(3,2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # 关系定义
    geojson = db.relationship('CountryGeoJSON', backref='country', uselist=False, lazy=True)
    demographics = db.relationship('Demographic', backref='country', uselist=False, lazy=True)
    education = db.relationship('Education', backref='country', uselist=False, lazy=True)
    economy = db.relationship('Economy', backref='country', uselist=False, lazy=True)
    industries = db.relationship('Industry', backref='country', lazy=True)
    milestones = db.relationship('Milestone', backref='country', uselist=False, lazy=True)
    events = db.relationship('HistoricalEvent', backref='country', lazy=True)
    country_metadata = db.relationship('Metadata', backref='country', uselist=False, lazy=True)


class CountryGeoJSON(db.Model):
    __tablename__ = 'country_geojson'
    
    id = db.Column(db.Integer, primary_key=True)
    country_id = db.Column(db.String(2), db.ForeignKey('countries.id', ondelete='CASCADE'), nullable=False)
    feature_type = db.Column(db.String(20), nullable=False)
    geometry_type = db.Column(db.String(20), nullable=False)
    coordinates = db.Column(JSONB, nullable=False)  # PostgreSQL JSONB类型


class Demographic(db.Model):
    __tablename__ = 'demographics'
    
    country_id = db.Column(db.String(2), db.ForeignKey('countries.id', ondelete='CASCADE'), primary_key=True)
    gender_ratio = db.Column(db.Numeric(3,2))
    urban_ratio = db.Column(db.Numeric(3,2))
    median_age = db.Column(db.Integer)
    birth_rate = db.Column(db.Numeric(5,2))


class Education(db.Model):
    __tablename__ = 'education'
    
    country_id = db.Column(db.String(2), db.ForeignKey('countries.id', ondelete='CASCADE'), primary_key=True)
    school_start_age = db.Column(db.Integer)
    high_school_rate = db.Column(db.Numeric(3,2))
    university_rate = db.Column(db.Numeric(3,2))


class Economy(db.Model):
    __tablename__ = 'economy'
    
    country_id = db.Column(db.String(2), db.ForeignKey('countries.id', ondelete='CASCADE'), primary_key=True)
    gdp_per_capita = db.Column(db.Numeric(12,2))
    internet_penetration = db.Column(db.Numeric(3,2))


class Industry(db.Model):
    __tablename__ = 'industries'
    
    id = db.Column(db.Integer, primary_key=True)
    country_id = db.Column(db.String(2), db.ForeignKey('countries.id', ondelete='CASCADE'), nullable=False)
    industry_name = db.Column(db.String(50), nullable=False)


class Milestone(db.Model):
    __tablename__ = 'milestones'
    
    country_id = db.Column(db.String(2), db.ForeignKey('countries.id', ondelete='CASCADE'), primary_key=True)
    avg_marriage_age = db.Column(db.Integer)
    avg_first_child_age = db.Column(db.Integer)
    life_expectancy = db.Column(db.Integer)


class HistoricalEvent(db.Model):
    __tablename__ = 'historical_events'
    
    id = db.Column(db.Integer, primary_key=True)
    country_id = db.Column(db.String(2), db.ForeignKey('countries.id', ondelete='CASCADE'), nullable=False)
    event_name = db.Column(db.String(100), nullable=False)
    event_year = db.Column(db.Integer, nullable=False)
    impact_type = db.Column(db.String(20), nullable=False)
    
    __table_args__ = (
        db.Index('idx_event_year', 'event_year'),
    )


class Metadata(db.Model):
    __tablename__ = 'metadata'
    
    country_id = db.Column(db.String(2), db.ForeignKey('countries.id', ondelete='CASCADE'), primary_key=True)
    source = db.Column(db.String(100), nullable=False)
    license = db.Column(db.String(50), nullable=False)