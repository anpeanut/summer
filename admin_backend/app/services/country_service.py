from cerberus import Validator
from app.schemas.country import country_schema
from app import db
from app.models import Country, Demographic
from app.utils.api_response import APIResponse
from app.services.data_updater import DataUpdater
import random
from sqlalchemy import func

class CountryService:
    @staticmethod
    def validate_country_data(input_data: dict) -> tuple:
        validator = Validator(country_schema)
        if not validator.validate(input_data):
            print("Cerberus validation errors:", validator.errors)
            return False, validator.errors
        return True, validator.normalized(input_data)
    
    @staticmethod
    def update_country_data():
        updater = DataUpdater(batch_size=30)  # 每批处理30个国家
    
        try:
            # 执行全量批量更新
            print("Starting batch update of all countries...")
            result = updater.batch_update_all_countries()

            # 打印结果摘要
            print("\nBatch Update Summary:")
            print(f"Status: {result['status']}")
            print(f"Total Countries: {result['total']}")
            print(f"Updated Successfully: {result['updated']}")
            print(f"Failed: {result['failed']}")

            # 如果有失败的国家，打印详细信息
            if result["failed"] > 0:
                print("\nFailed Countries:")
                for idx, country in enumerate(result["failed_countries"], 1):
                    print(f"{idx}. {country['code']} ({country['name']}): {country['error']}")

        finally:
            updater.close()
    
