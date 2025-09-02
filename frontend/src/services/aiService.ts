import { CountryData, LifeEvent } from '../types';

/**
 * 通过调用后端服务来流式生成人生故事。
 * 后端服务会代理对AI API的调用。
 * @param countryData - 用于生成故事的扩展国家数据。
 * @param onEventReceived - 每接收到一个完整的人生事件对象时调用的回调函数。
 * @param onError - 发生错误时的回调函数。
 * @param onComplete - 数据流结束时的回调函数。
 */
export const generateLifeStory = async (
  countryData: CountryData,
  onEventReceived: (event: LifeEvent) => void,
  onError: (error: Error) => void,
  onComplete: () => void
): Promise<void> => {
  const apiEndpoint = '/api/generate-story'; // 指向我们的新后端API

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(countryData), // 将国家数据作为请求体发送
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`后端API请求失败，状态码: ${response.status}: ${errorBody}`);
    }

    if (!response.body) {
      throw new Error("响应体为空");
    }

    // 后端直接返回NDJSON流，处理逻辑比之前简单得多
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留不完整的行

      for (const line of lines) {
        if (line.trim().length > 0) {
          try {
            const event = JSON.parse(line);
            // 检查是否是后端传来的错误对象
            if (event.error) {
              throw new Error(`后端服务错误: ${event.message}`);
            }
            onEventReceived(event);
          } catch (e) {
            console.error("解析NDJSON行失败，已跳过:", line, e);
          }
        }
      }
    }

    // 处理缓冲区中可能剩余的最后一行
    if (buffer.trim().length > 0) {
      try {
        const event = JSON.parse(buffer);
        if (event.error) {
          throw new Error(`后端服务错误: ${event.message}`);
        }
        onEventReceived(event);
      } catch (e) {
        console.error("解析最终的NDJSON行失败:", buffer, e);
      }
    }

  } catch (error) {
    console.error("与后端服务通信时发生错误:", error);
    onError(error as Error);
  } finally {
    onComplete();
  }
};
