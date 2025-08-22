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
                                            ]
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    'storySeed': {
        'type': 'dict',
        'required': False,
        'schema': {
            'demographics': {
                'type': 'dict',
                'required': False,
                'schema': {
                    'gender_ratio': {'type': 'float', 'min': 0, 'max': 1},
                    'urban_ratio': {'type': 'float', 'min': 0, 'max': 1},
                    'median_age': {'type': 'integer', 'min': 0}
                }
            },
            'education': {
                'type': 'dict',
                'required': False,
                'schema': {
                    'school_start_age': {'type': 'integer', 'min': 0},
                    'high_school_rate': {'type': 'float', 'min': 0, 'max': 1},
                    'university_rate': {'type': 'float', 'min': 0, 'max': 1}
                }
            },
            'environment': {
                'type': 'dict',
                'required': False,
                'schema': {
                    'gdp_per_capita': {'type': 'float', 'min': 0},
                    'internet_penetration': {'type': 'float', 'min': 0, 'max': 1},
                    'main_industries': {
                        'type': 'list',
                        'schema': {'type': 'string', 'empty': False}
                    }
                }
            },
            'milestones': {
                'type': 'dict',
                'required': False,
                'schema': {
                    'avg_marriage_age': {'type': 'integer', 'min': 0},
                    'avg_first_child_age': {'type': 'integer', 'min': 0},
                    'life_expectancy': {'type': 'integer', 'min': 0}
                }
            },
            'historicalEvents': {
                'type': 'list',
                'required': False,
                'schema': {
                    'type': 'dict',
                    'schema': {
                        'name': {'type': 'string', 'empty': False},
                        'year': {'type': 'integer'},
                        'impact': {'type': 'string', 'empty': False}
                    }
                }
            }
        }
    }
}