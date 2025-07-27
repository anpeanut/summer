
### API 文档 (v1.0)

#### 文件位置: `Docs/API.md`

```markdown
# 国家数据 API 规范 (v1.0)

## 基础说明
- **API 版本**: 1.0
- **数据格式**: JSON
- **字符编码**: UTF-8
- **时间格式**: ISO 8601 (例如: "2023-11-15T14:30:00Z")

## 获取国家数据

### 请求
- **URL**: `待填充`
- **方法**: `GET`
- **参数**: 无
- **认证**: 不需要

### 成功响应 (HTTP 200)
```json
{
  "apiVersion": "1.0",
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
    }
  },
  "metadata": {
    "source": "World Bank",
    "license": "CC BY 4.0"
  }
}
```

### 字段说明

#### 根对象
| 字段        | 类型    | 必填 | 说明                          | 示例值                  |
|-------------|---------|------|-------------------------------|-------------------------|
| apiVersion  | string  | ✓    | API版本                       | "1.0"                   |
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

#### 位置对象 (location)
| 字段        | 类型   | 必填 | 说明                          | 示例值                |
|-------------|--------|------|-------------------------------|-----------------------|
| type        | string | ✓    | 地理类型                      | "Point"              |
| coordinates | array  | ✓    | [经度, 纬度]                  | [104.1954, 35.8617]  |

#### 元数据对象 (metadata)
| 字段     | 类型   | 必填 | 说明         | 示例值              |
|----------|--------|------|--------------|---------------------|
| source   | string | ✓    | 数据来源     | "World Bank"        |
| license  | string | ✓    | 数据许可协议 | "CC BY 4.0"         |

### 错误响应 (HTTP 4xx/5xx)
```json
{
  "apiVersion": "1.0",
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

