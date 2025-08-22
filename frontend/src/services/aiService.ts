import { CountryData, LifeEvent, ApiKeyConfig } from '../types';
import { getLifeStoryPrompt } from '../prompts/lifeStoryPrompt';

/**
 * 动态获取AI服务的配置（API密钥和端点）。
 * 在本地开发环境，它会从.env文件读取。
 * 在云端生产环境，它会从后端 /api/hello 接口获取密钥。
 * @returns 返回一个包含apiKey的Promise，如果失败则返回null。
 */
const getApiKeyConfig = async (): Promise<ApiKeyConfig | null> => {
  

 

  // 检查是否存在本地环境变量作为判断依据
  const localApiKey = process.env.REACT_APP_SILICONFLOW_API_KEY;

  if (localApiKey) {
    // 本地开发模式：直接使用.env文件中的密钥
    console.log("检测到本地API密钥，使用本地模式。");
    return { apiKey: localApiKey};
  } else {
    // 云端生产模式：从后端接口获取密钥
    console.log("未检测到本地API密钥，尝试从云端获取。");
    try {
      const response = await fetch('/api/hello');
      if (!response.ok) {
        throw new Error(`获取云端API密钥失败，状态码: ${response.status}`);
      }
      const cloudApiKey = await response.text();
      if (!cloudApiKey) {
        throw new Error("从云端获取的API密钥为空。");
      }
      return { apiKey: cloudApiKey };
    } catch (error) {
      console.error("获取云端API密钥时发生错误:", error);
      return null;
    }
  }
};

/**
 * 通过调用AI API流式生成人生故事。
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
  const apiEndpoint = "https://api.siliconflow.cn/v1/chat/completions";
  // 1. 动态获取API配置
  const config = await getApiKeyConfig();

  if (!config) {
    const error = new Error("无法获取AI API配置,使用模拟数据。");
    const totalEvent= await generateMockLifeStory();
    totalEvent.forEach(event => onEventReceived(event));
    onError(error);
    onComplete();
    return;
  }

  const prompt = getLifeStoryPrompt(countryData);

  // 3. 调用AI API
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-ai/DeepSeek-V3", // 使用V3模型
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4096, // 限制最大token
        stream: true,
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`AI API 请求失败，状态码: ${response.status}: ${errorBody}`);
    }

    if (!response.body) {
      throw new Error("响应体为空");
    }

    // 处理流式响应
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';
    let contentBuffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      
      sseBuffer += decoder.decode(value, { stream: true });
      const sseLines = sseBuffer.split('\n');
      sseBuffer = sseLines.pop() || ''; // 保留不完整的SSE行

      for (const sseLine of sseLines) {
        if (sseLine.startsWith('data: ')) {
          const data = sseLine.substring(6);
          if (data.trim() === '[DONE]') {
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const deltaContent = parsed.choices[0]?.delta?.content;
            if (deltaContent) {
              console.log(`[${new Date().toISOString()}] LOG: AI Service - Received content chunk.`);
              contentBuffer += deltaContent;
              
              // 检查内容缓冲区中是否有完整的NDJSON行
              const contentLines = contentBuffer.split('\n');
              contentBuffer = contentLines.pop() || ''; // 保留不完整的JSON行

              for (const contentLine of contentLines) {
                // 增加更严格的检查：只有以'{'开头的行才被认为是有效的JSON对象
                if (contentLine.trim().startsWith('{')) {
                  const event = parseNdjsonLine(contentLine, (error, line) => {
                    // 当单行解析失败时，在控制台打印详细错误，而不是让整个流失败
                    console.error("单行解析失败，已跳过:", {
                      line,
                      error,
                    });
                  });
                  if (event) {
                    console.log(`[${new Date().toISOString()}] LOG: AI Service - Parsed and sending event for year ${event.year}.`);
                    onEventReceived(event);
                  }
                }
              }
            }
          } catch (e) {
            // 忽略单个SSE块的解析错误
          }
        }
      }
    }

    // After the loop, process any remaining data in the buffer
    if (contentBuffer.trim().length > 0) {
        console.log(`[${new Date().toISOString()}] LOG: AI Service - Processing final buffer content.`);
        if (contentBuffer.trim().startsWith('{')) {
            const event = parseNdjsonLine(contentBuffer, (error, line) => {
                console.error("Final buffer parsing failed, skipping:", { line, error });
            });
            if (event) {
                console.log(`[${new Date().toISOString()}] LOG: AI Service - Parsed and sending final event for year ${event.year}.`);
                onEventReceived(event);
            }
        }
    }
  } catch (error) {
    console.error("生成人生故事时发生流式错误:", error);
    onError(error as Error);
  } finally {
    onComplete();
  }
};

/**
 * 健壮的NDJSON行解析器。
 * @param line - 从流中接收到的一行文本。
 * @returns 如果解析成功，返回LifeEvent对象；否则返回null。
 */
function parseNdjsonLine(
  line: string,
  onError: (error: Error, line: string) => void
): LifeEvent | null {
  try {
    // 尝试直接解析最干净的情况
    return JSON.parse(line);
  } catch (e: any) {
    // 如果直接解析失败，尝试进行清理
    // 1. 寻找被包裹的JSON对象
    const jsonMatch = line.match(/\{.*\}/);
    if (jsonMatch) {
      try {
        // 2. 尝试解析提取出的部分
        return JSON.parse(jsonMatch[0]);
      } catch (finalError: any) {
        // 如果清理后仍然失败，则调用错误回调
        onError(new Error(`无法解析清理后的JSON: ${finalError.message}`), line);
        return null;
      }
    }
    // 如果连花括号都找不到，调用错误回调
    onError(new Error(`无效的流数据行，无法找到JSON对象: ${e.message}`), line);
    return null;
  }
}

/**
 * 提供一个模拟的人生故事，用于开发和测试。
 * @returns 返回一个预定义的、包含人生事件数组的Promise。
 */
export const generateMockLifeStory = async (): Promise<LifeEvent[]> => {
    console.log("API调用失败或未配置，降级使用模拟AI故事。");
    await new Promise(resolve => setTimeout(resolve, 800));
    return [
        { year: 1995, age: 5, event: "进入本地小学，开始了九年义务教育。", category: 'Education' },
        { year: 2008, age: 18, event: "参加了激烈的高考，并考入了一所不错的大学，学习计算机科学。", category: 'Education' },
        { year: 2012, age: 22, event: "大学毕业，在一家迅速发展的电子商务公司找到了第一份工作。", category: 'Career' },
        { year: 2018, age: 28, event: "与相爱多年的伴侣结婚，组建了自己的小家庭。", category: 'Relationship' },
        { year: 2021, age: 31, event: "在工作的城市里，通过努力贷款购买了第一套房子。", category: 'Milestone' },
        { year: 2023, age: 33, event: "孩子出生了，生活进入了一个全新的、充满挑战和喜悦的阶段。", category: 'Relationship' },
    ];
}
