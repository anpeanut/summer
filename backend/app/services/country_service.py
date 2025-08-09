from cerberus import Validator
from app.schemas.country import country_schema

class CountryService:
    @staticmethod
    def validate_country_data(input_data: dict) -> tuple:
        validator = Validator(country_schema)
        if not validator.validate(input_data):
            return False, validator.errors
        return True, validator.normalized(input_data)
    
    @staticmethod
    def get_default_country() -> dict:
        valid, data = CountryService.validate_country_data({})
        return data