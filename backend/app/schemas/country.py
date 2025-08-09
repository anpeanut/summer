country_schema = {
    'id': {'type': 'string', 'required': False, 'default': 'CN'},
    'name': {'type': 'string', 'required': False, 'default': '中国'},
    'population': {'type': 'integer', 'required': False, 'default': 1412000000},
    'capital': {'type': 'string', 'required': False, 'default': '北京'},
    'location': {
        'type': 'dict',
        'required': False,
        'default': {'type': 'Point', 'coordinates': [104.1954, 35.8617]},
        'schema': {
            'type': {'type': 'string', 'allowed': ['Point']},
            'coordinates': {
                'type': 'list',
                'items': [{'type': 'float'}, {'type': 'float'}]
            }
        }
    }
}