import requests
import json
import re
from flask import current_app
from ..prompts.life_story_prompt import get_life_story_prompt

def parse_ndjson_line(line: str):
    """
    健壮的NDJSON行解析器，从Python复刻自前端的 parseNdjsonLine 函数。
    @param line: 从流中接收到的一行文本。
    @returns: 如果解析成功，返回字典对象；否则返回None。
    """
    try:
        # 尝试直接解析最干净的情况
        return json.loads(line)
    except json.JSONDecodeError:
        # 如果直接解析失败，尝试进行清理
        # 1. 寻找被包裹的JSON对象
        json_match = re.search(r'\{.*\}', line)
        if json_match:
            try:
                # 2. 尝试解析提取出的部分
                return json.loads(json_match.group(0))
            except json.JSONDecodeError as final_error:
                # 如果清理后仍然失败，则记录错误
                current_app.logger.error(f"无法解析清理后的JSON: {final_error}, 原始行: '{line}'")
                return None
        # 如果连花括号都找不到，记录错误
        current_app.logger.error(f"无效的流数据行，无法找到JSON对象: '{line}'")
        return None

def generate_life_story_stream(country_data):
    """
    通过直接调用API流式生成人生故事，忠实迁移前端 past.ts 的核心逻辑。
    这是一个生成器函数，会逐个产出（yield）解析后的人生事件对象。
    @param country_data: 用于生成故事的国家数据。
    """
    api_key = current_app.config.get('SILICONFLOW_API_KEY')
    api_base = current_app.config.get('SILICONFLOW_API_BASE', 'https://api.siliconflow.cn/v1')
    api_endpoint = f"{api_base}/chat/completions"

    if not api_key:
        current_app.logger.error("错误：后端未配置SILICONFLOW_API_KEY。")
        # 在生产环境中，你可能想抛出一个异常或返回一个错误消息
        # 为了与前端的降级逻辑对齐，这里我们返回一个空生成器
        return
        
    prompt = get_life_story_prompt(country_data)

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }
    payload = {
        "model": "deepseek-ai/DeepSeek-V3.1",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 4096,
        "stream": True,
    }

    try:
        with requests.post(api_endpoint, headers=headers, json=payload, stream=True) as response:
            response.raise_for_status()  # 如果状态码不是2xx，则抛出异常
            
            sse_buffer = ''
            content_buffer = ''
            decoder = response.encoding if response.encoding else 'utf-8'

            current_app.logger.info("成功连接到AI API，开始接收流式数据...")

            for chunk in response.iter_content(chunk_size=None, decode_unicode=True):
                sse_buffer += chunk
                
                # 分割SSE事件
                sse_lines = sse_buffer.split('\n')
                sse_buffer = sse_lines.pop() or '' # 保留不完整的行

                for sse_line in sse_lines:
                    if sse_line.startswith('data: '):
                        data_str = sse_line[6:]
                        if data_str.strip() == '[DONE]':
                            current_app.logger.info("接收到 [DONE] 信号，数据流结束。")
                            break
                        try:
                            parsed_data = json.loads(data_str)
                            delta_content = parsed_data.get('choices', [{}])[0].get('delta', {}).get('content')
                            if delta_content:
                                content_buffer += delta_content
                                
                                # 从内容缓冲区中分割NDJSON行
                                content_lines = content_buffer.split('\n')
                                content_buffer = content_lines.pop() or '' # 保留不完整的行

                                for content_line in content_lines:
                                    if content_line.strip().startswith('{'):
                                        event = parse_ndjson_line(content_line)
                                        if event:
                                            current_app.logger.info(f"成功解析并产出事件: 年份 {event.get('year')}")
                                            yield json.dumps(event) + '\n'
                        except json.JSONDecodeError:
                            current_app.logger.warning(f"无法解析此SSE数据块: '{data_str}'")
                            continue # 忽略单个损坏的SSE块
            
            # 处理循环结束后缓冲区中可能剩余的最后一部分数据
            if content_buffer.strip().startswith('{'):
                current_app.logger.info("正在处理缓冲区中的最后一个事件...")
                event = parse_ndjson_line(content_buffer)
                if event:
                    current_app.logger.info(f"成功解析并产出最后一个事件: 年份 {event.get('year')}")
                    yield json.dumps(event) + '\n'

    except requests.exceptions.RequestException as e:
        current_app.logger.error(f"调用AI API时发生网络错误: {e}")
        # 在实际应用中，这里可以 yield 一个错误对象
        error_event = {"error": True, "message": str(e)}
        yield json.dumps(error_event) + '\n'
    except Exception as e:
        current_app.logger.error(f"处理AI流时发生未知错误: {e}")
        error_event = {"error": True, "message": "An unexpected error occurred."}
        yield json.dumps(error_event) + '\n'
