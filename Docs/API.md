
### 升级版 API 文档 (v2.0)

```markdown
# 国家数据 API 规范 (v2.0)

## 基础说明
- **API 版本**: 2.0
- **数据格式**: JSON
- **字符编码**: UTF-8
- **时间格式**: ISO 8601 (例如: "2023-11-15T14:30:00Z")
- **核心变更**:
  - 新增 `storySeed` 模块支持人生故事生成
  - 所有新增字段均为可选
  - 添加数据完整度评分

## 获取国家数据

### 请求
- **URL**: `/api/country`
- **方法**: `GET`
- **参数**: 无
- **认证**: 不需要

### 成功响应 (HTTP 200)
```json
{
  "apiVersion": "2.0",
  "success": true,
  "timestamp": "2023-11-15T14:30:00Z",
  "data": {
    "id": "CN",
    "name": "中国",
    "population": 1412000000,
    "capital": "北京",
    "location": {
      "type": "Point",
      "coordinates": [104.1954, 35.8617]
    },
    "geoJson": {
      "type": "FeatureCollection",
      "features": [
        {
          "type": "Feature",
          "properties": {},
          "geometry": {
            "type": "Polygon",
            "coordinates": [
              [
                [109.6, 18.2],
                [109.6, 18.2],
                [109.6, 18.2]
              ]
            ]
          }
        }
      ]
    },
    "storySeed": {
      "demographics": {
        "gender_ratio": 0.51,
        "urban_ratio": 0.65,
        "median_age": 38
      },
      "education": {
        "school_start_age": 6,
        "high_school_rate": 0.85,
        "university_rate": 0.42
      },
      "environment": {
        "gdp_per_capita": 12500,
        "internet_penetration": 0.78,
        "main_industries": ["制造业", "IT服务"]
      },
      "milestones": {
        "avg_marriage_age": 28,
        "avg_first_child_age": 30,
        "life_expectancy": 76
      },
      "historicalEvents": [
        {
          "name": "COVID-19",
          "year": 2020,
          "impact": "global"
        },
        {
          "name": "移动支付普及",
          "year": 2015,
          "impact": "economic"
        }
      ]
    }
  },
  "metadata": {
    "source": "World Bank",
    "license": "CC BY 4.0",
    "dataCompleteness": 0.8
  }
}
```

### 字段说明

#### 根对象
| 字段        | 类型    | 必填 | 说明                          | 示例值                  |
|-------------|---------|------|-------------------------------|-------------------------|
| apiVersion  | string  | ✓    | API版本                       | "2.0"                   |
| success     | boolean | ✓    | 请求是否成功                  | true                    |
| timestamp   | string  | ✓    | 服务器响应时间                | "2023-11-15T14:30:00Z"  |
| data        | object  | ✓    | 国家数据对象                  | { ... }                 |
| metadata    | object  | ✓    | 元数据信息                    | { ... }                 |

#### 国家数据对象 (data)
| 字段       | 类型    | 必填 | 说明                          | 示例值                |
|------------|---------|------|-------------------------------|-----------------------|
| id         | string  | ✓    | 国家ISO代码                   | "CN"                 |
| name       | string  | ✓    | 国家全名                      | "中国"               |
| population | number  | ✓    | 人口数量                      | 1412000000           |
| capital    | string  | ✓    | 首都名称                      | "北京"               |
| location   | object  | ✓    | 地理位置信息                  | { ... }              |
| geoJson    | object  | ✓    | 国家地理边界 (GeoJSON)        | { ... }              |
| storySeed  | object  | ✗    | 故事生成锚点数据              | { ... }              |

#### 位置对象 (location)
| 字段        | 类型   | 必填 | 说明                          | 示例值                |
|-------------|--------|------|-------------------------------|-----------------------|
| type        | string | ✓    | 地理类型                      | "Point"              |
| coordinates | array  | ✓    | [经度, 纬度]                  | [104.1954, 35.8617]  |

#### 故事种子对象 (storySeed)
| 字段            | 类型   | 必填 | 说明                          |
|-----------------|--------|------|-------------------------------|
| demographics    | object | ✗    | 人口统计数据                  |
| education       | object | ✗    | 教育系统数据                  |
| environment     | object | ✗    | 经济环境数据                  |
| milestones      | object | ✗    | 人生里程碑数据                |
| historicalEvents| array  | ✗    | 历史事件列表                  |

##### 人口统计 (demographics)
| 字段         | 类型   | 必填 | 说明                     | 示例值 |
|--------------|--------|------|--------------------------|--------|
| gender_ratio | number | ✗    | 男性占比 (0.0-1.0)       | 0.51   |
| urban_ratio  | number | ✗    | 城镇人口比例 (0.0-1.0)   | 0.65   |
| median_age   | number | ✗    | 年龄中位数               | 38     |

##### 教育系统 (education)
| 字段             | 类型   | 必填 | 说明                     | 示例值 |
|------------------|--------|------|--------------------------|--------|
| school_start_age | number | ✗    | 平均入学年龄             | 6      |
| high_school_rate | number | ✗    | 中学入学率 (0.0-1.0)     | 0.85   |
| university_rate  | number | ✗    | 大学升学率 (0.0-1.0)     | 0.42   |

##### 经济环境 (environment)
| 字段                | 类型     | 必填 | 说明                     | 示例值       |
|---------------------|----------|------|--------------------------|--------------|
| gdp_per_capita      | number   | ✗    | 人均GDP (美元)           | 12500        |
| internet_penetration| number   | ✗    | 互联网普及率 (0.0-1.0)   | 0.78         |
| main_industries     | string[] | ✗    | 主要产业列表             | ["制造业"]   |

##### 人生里程碑 (milestones)
| 字段                | 类型   | 必填 | 说明                     | 示例值 |
|---------------------|--------|------|--------------------------|--------|
| avg_marriage_age    | number | ✗    | 平均初婚年龄             | 28     |
| avg_first_child_age | number | ✗    | 首胎生育平均年龄         | 30     |
| life_expectancy     | number | ✗    | 预期寿命                 | 76     |

##### 历史事件 (historicalEvents)
| 字段   | 类型   | 必填 | 说明                     | 示例值       |
|--------|--------|------|--------------------------|--------------|
| name   | string | ✗    | 事件名称                 | "COVID-19"   |
| year   | number | ✗    | 发生年份                 | 2020         |
| impact | string | ✗    | 影响范围标签             | "global"     |

#### 元数据对象 (metadata)
| 字段             | 类型   | 必填 | 说明                     | 示例值       |
|------------------|--------|------|--------------------------|--------------|
| source           | string | ✓    | 数据来源                 | "World Bank" |
| license          | string | ✓    | 数据许可协议             | "CC BY 4.0"  |
| dataCompleteness | number | ✗    | 数据完整度评分 (0.0-1.0) | 0.8          |

### 错误响应 (HTTP 4xx/5xx)
```json
{
  "apiVersion": "2.0",
  "success": false,
  "timestamp": "2023-11-15T14:32:10Z",
  "error": {
    "code": "404",
    "message": "Country not found",
    "details": "The requested resource does not exist"
  },
  "metadata": {
    "source": "World Bank",
    "license": "CC BY 4.0"
  }
}
```

#### 错误对象 (error)
| 字段     | 类型   | 必填 | 说明                     | 示例值                      |
|----------|--------|------|--------------------------|-----------------------------|
| code     | string | ✓    | 错误代码                 | "404"                       |
| message  | string | ✓    | 错误摘要信息             | "Country not found"         |
| details  | string | ✗    | 详细错误信息 (可选)      | "The requested country..."  |

## 数据缺失处理策略
1. **storySeed 整体缺失**  
   - 使用ai编写
   
2. **部分字段缺失**  
   - 使用ai编写替代
   - 示例默认值：
     ```json
     {
       "gender_ratio": 0.5,
       "urban_ratio": 0.55,
       "school_start_age": 6,
       "life_expectancy": 72
     }
     ```

3. **历史事件缺失**  
   - 使用ai编写：
     ```json
     [
       {"name": "COVID-19", "year": 2020, "impact": "global"},
       {"name": "智能手机普及", "year": 2012, "impact": "tech"}
     ]
     ```

4. **数据完整度提示**  
   - 当 `dataCompleteness < 0.6` 时建议前端显示提示：
     > "部分数据缺失，故事生成可能不够精确"
```

---

## 返回你好

### 请求
- **URL**: `/api/hello`
- **方法**: `GET`
- **认证**: 不需要
- **说明**: 无

### 成功响应 (HTTP 200)
- **Content-Type**: `text/plain`
- **内容**: hello world。



```

---

## 3. 生成人生故事 (流式)

- **Endpoint**: `POST /api/generate-story`
- **描述**: 接收一个国家的数据作为输入，通过调用后端的AI服务，以流式（streaming）的方式返回一个虚构的人生故事。此接口将API密钥安全地保留在后端。
- **请求体 (Request Body)**:
  - `Content-Type: application/json`
  - 请求体应包含一个国家的数据对象，与 `/api/country` 返回的 `data` 字段结构相似。
    ```json
    {
      "id": "CN",
      "name": "中国",
      "population": 1412000000,
      "capital": "北京",
      "location": {
        "type": "Point",
        "coordinates": [104.1954, 35.8617]
      },
      "storySeed": { ... }
    }
    ```
- **成功响应 (200 OK)**:
  - `Content-Type: application/x-ndjson`
  - 响应是一个数据流，由换行符 (`\n`) 分隔的JSON对象组成。每个JSON对象代表一个人生事件。
    ```json
    {"year": 1985, "age": 0, "event": "在一个普通的家庭中，我出生了。", "category": "Milestone"}
    {"year": 1991, "age": 6, "event": "我开始了我的小学教育。", "category": "Education"}
    ...
    ```
- **错误响应 (400 Bad Request)**:
  - 如果请求体不是有效的JSON。
    ```json
    {
      "apiVersion": "1.0",
      "success": false,
      "timestamp": "...",
      "error": {
        "code": "400",
        "message": "Request body must be a valid JSON."
      }
    }
    ```
- **错误响应 (500 Internal Server Error)**:
  - 如果后端AI密钥未配置或AI服务调用失败，响应流中会包含一个错误事件。
    ```json
    {"year": 1990, "age": 0, "event": "错误：AI服务的API密钥未配置。请检查后端环境变量。", "category": "error"}
    ```
