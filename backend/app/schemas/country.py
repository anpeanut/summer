#无默认值
country_schema = {
    'id': {'type': 'string', 'required': True, 'empty': False},
    'name': {'type': 'string', 'required': True, 'empty': False},
    'population': {'type': 'integer', 'required': True, 'min': 0},
    'capital': {'type': 'string', 'required': True, 'empty': False},
    'location': {
        'type': 'dict',
        'required': True,
        'schema': {
            'type': {'type': 'string', 'allowed': ['Point']},
            'coordinates': {
                'type': 'list',
                'items': [
                    {'type': 'float', 'min': -180, 'max': 180},  # 经度
                    {'type': 'float', 'min': -90, 'max': 90}     # 纬度
                ]
            }
        }
    },
    'geoJson': {
        'type': 'dict',
        'required': True,
        'schema': {
            'type': {'type': 'string', 'allowed': ['FeatureCollection']},
            'features': {
                'type': 'list',
                'schema': {
                    'type': 'dict',
                    'schema': {
                        'type': {'type': 'string', 'allowed': ['Feature']},
                        'properties': {'type': 'dict'},
                        'geometry': {
                            'type': 'dict',
                            'schema': {
                                'type': {'type': 'string', 'allowed': ['Polygon']},
                                'coordinates': {
                                    'type': 'list',
                                    'schema': {
                                        'type': 'list',
                                        'schema': {
                                            'type': 'list',
                                            'items': [
                                                {'type': 'float', 'min': -180, 'max': 180},
                                                {'type': 'float', 'min': -90, 'max': 90}
                                            ],
                                            'minlength': 2,  # 确保每个点有 2 个元素
                                            'maxlength': 2
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }, 
        'nullable': True
    },
    'storySeed': {
        'type': 'dict',
        'required': False,
        'schema': {
            'demographics': {
                'type': 'dict',
                'required': False,
                'schema': {
                    'gender_ratio': {'type': 'float', 'min': 0, 'max': 1, 'default': 0.5},
                    'urban_ratio': {'type': 'float', 'min': 0, 'max': 1, 'nullable': True},
                    'median_age': {'type': 'integer', 'min': 0, 'nullable': True}
                }
            },
            'education': {
                'type': 'dict',
                'required': False,
                'nullable': True,
                'schema': {
                    'school_start_age': {'type': 'integer', 'min': 0, 'nullable': True},
                    'high_school_rate': {'type': 'float', 'min': 0, 'max': 1, 'nullable': True},
                    'university_rate': {'type': 'float', 'min': 0, 'max': 1, 'nullable': True}
                }
            },
            'environment': {
                'type': 'dict',
                'required': False,
                'schema': {
                    'gdp_per_capita': {'type': 'float', 'min': 0, 'nullable': True},
                    'internet_penetration': {'type': 'float', 'min': 0, 'max': 1, 'nullable': True},
                    'main_industries': {
                        'type': 'list',
                        'schema': {'type': 'string', 'empty': False}, 
                        'nullable': True
                    }
                }
            },
            'milestones': {
                'type': 'dict',
                'required': False,
                'nullable': True,
                'schema': {
                    'avg_marriage_age': {'type': 'integer', 'min': 0, 'nullable': True},
                    'avg_first_child_age': {'type': 'integer', 'min': 0, 'nullable': True},
                    'life_expectancy': {'type': 'integer', 'min': 0, 'nullable': True}
                }
            },
            'historicalEvents': {
                'type': 'list',
                'required': False,
                'schema': {
                    'type': 'dict',
                    'schema': {
                        'name': {'type': 'string', 'empty': False, 'nullable': True},
                        'year': {'type': 'integer', 'nullable': True},
                        'impact': {'type': 'string', 'empty': False, 'nullable': True}
                    }
                }, 
                'nullable': True
            }
        }
    }
}