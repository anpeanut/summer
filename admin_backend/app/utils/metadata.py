from typing import Dict

class Metadata:
    """元数据管理类"""
    
    _metadata = {
        "source": "World Bank",
        "license": "CC BY 4.0",
        "version": "1.0.0"
    }

    @staticmethod
    def get_metadata() -> Dict[str, str]:
        """
        获取标准元数据
        :return: 元数据字典
        """
        return Metadata._metadata

    @staticmethod
    def update_metadata(key: str, value: str):
        """
        更新元数据
        :param key: 键名
        :param value: 值
        """
        Metadata._metadata[key] = value

    @staticmethod
    def remove_metadata(key: str):
        """
        移除元数据项
        :param key: 要移除的键名
        """
        if key in Metadata._metadata:
            del Metadata._metadata[key]