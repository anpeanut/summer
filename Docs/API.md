# 国家数据 API 规范 (v1.0)

## 基础说明
- **API 版本**: 1.0
- **数据格式**: JSON
- **字符编码**: UTF-8
- **时间格式**: ISO 8601 (例如: "2023-11-15T14:30:00Z")
- **响应标准化**: 所有响应包含 `apiVersion`、`timestamp` 和 `metadata` 字段

## 接口列表

### 1. 基础测试接口
- **URL**: `/api/hello`
- **方法**: `GET`
- **认证**: 不需要
- **成功响应 (HTTP 200)**:
```json
{
"message": "Hello World from Flask!"
}
```

### 2. HTML模板接口
- **URL**: `/api/surprise`
- **方法**: `GET`
- **响应**: 返回渲染后的 `surprise.html` 模板

### 3. 国家数据接口
#### GET `/api/country`
- **功能**: 获取默认国家数据（中国）
- **成功响应 (HTTP 200)**:
```json
{
"apiVersion": "1.0",
"success": true,
"timestamp": "2025-08-06T08:00:00Z",
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

#### POST `/api/country`
- **功能**: 提交并验证国家数据
- **请求规范**:
```json
{
"id": "US",// 可选，字符串类型
"population": 331000000,// 可选，整数类型
"location": {// 可选，需符合GeoJSON格式
"type": "Point",
"coordinates": [-98.5795, 39.8283]
}
}
```
- **校验规则**:
- `location.coordinates` 必须包含2个浮点数
- `population` 必须为整数
- **错误响应 (HTTP 400)**:
```json
{
"apiVersion": "1.0",
"success": false,
"error": {
"code": "400",
"message": "Invalid request data",
"details": "{'location': ['must be of dict type']}"
},
"metadata": {
"source": "World Bank",
"license": "CC BY 4.0"
}
}
```

### 4. 文档接口
- **URL**: `/Docs/API.md`
- **方法**: `GET`
- **响应**: 返回 `project_docs/API.md` 文件的原始内容（Content-Type: text/markdown）

## 数据结构定义
### 国家数据对象 (data)
| 字段| 类型| 必填 | 说明| 示例值|
|------------|---------|------|-------------------------------|-----------------------|
| id| string| ✓| 国家ISO代码| "CN"|
| name| string| ✓| 国家全名| "中国"|
| population | integer | ✓| 人口数量| 1412000000|
| capital| string| ✓| 首都名称| "北京"|
| location| object| ✓| GeoJSON格式的地理位置| { "type": "Point", ... } |

### 错误对象 (error)
| 字段| 类型| 必填 | 说明|
|----------|--------|------|--------------------------|
| code| string | ✓| 错误代码（如400/500）|
| message| string | ✓| 错误摘要信息|
| details| string | ✗| 详细错误信息（可选）|

## 使用示例
### 获取国家数据
```bash
curl -X GET http://localhost:5000/api/country
```

### 提交国家数据
```bash
curl -X POST http://localhost:5000/api/country \
-H "Content-Type: application/json" \
-d '{"population":1400000000}'
```

> **注**: 所有时间戳为UTC格式，元数据包含数据来源和许可协议信息。
> 完整校验规则见代码中的 `country_schema` 定义 (app.txt)。