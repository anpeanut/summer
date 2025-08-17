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
        model: "deepseek-ai/DeepSeek-V3",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 20000,
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
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // 保留下次循环处理的不完整行

      for (const line of lines) {
        if (line.trim()) { // 忽略空行
          const event = parseNdjsonLine(line);
          if (event) {
            onEventReceived(event);
          }
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
function parseNdjsonLine(line: string): LifeEvent | null {
  try {
    // 尝试直接解析最干净的情况
    return JSON.parse(line);
  } catch (e) {
    // 如果直接解析失败，尝试进行清理
    // 1. 寻找被包裹的JSON对象
    const jsonMatch = line.match(/\{.*\}/);
    if (jsonMatch) {
      try {
        // 2. 尝试解析提取出的部分
        return JSON.parse(jsonMatch[0]);
      } catch (finalError) {
        // 如果清理后仍然失败，则放弃这一行
        console.warn("无法解析的流数据行:", line);
        return null;
      }
    }
    // 如果连花括号都找不到，基本可以确定不是有效数据
    console.warn("已丢弃无效的流数据行:", line);
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
