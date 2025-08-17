import { CountryData, LifeEvent, ApiKeyConfig } from '../types';

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
 * 通过调用AI API生成人生故事。
 * @param countryData - 用于生成故事的扩展国家数据。
 * @returns 返回一个包含人生事件数组的Promise。
 */
export const generateLifeStory = async (countryData: CountryData): Promise<LifeEvent[]> => {
  const apiEndpoint = "https://api.siliconflow.cn/v1/chat/completions";
  // 1. 动态获取API配置
  const config = await getApiKeyConfig();

  if (!config) {
    console.error("无法获取AI API配置，降级使用模拟数据。");
    return generateMockLifeStory();
  }

  // 2. 设计提示词 (Prompt)
  const prompt = `
    你是一个人生故事生成器。请根据以下关于【${countryData.name}】的数据，
    为一个出生于1990年的人，生成一个符合该国国情的、简短的人生故事。
    
    国家信息:
    - 人均GDP (美元): ${countryData.storySeed?.environment?.gdp_per_capita || '未知'}
    - 主流教育水平: ${countryData.storySeed?.education?.university_rate ? (countryData.storySeed.education.university_rate * 100).toFixed(0) + '% 大学升学率' : '未知'}
    - 主要产业: ${countryData.storySeed?.environment?.main_industries?.join(', ') || '未知'}

    故事应包含8到12个独立的人生事件。
    输出结果必须是一个纯粹的、不包含任何其他文本或解释的、格式正确的JSON数组。
    数组中的每个对象都必须严格遵循以下TypeScript接口定义:
    interface LifeEvent {
      year: number;       // 事件发生的年份
      age: number;        // 当事人当时的年龄
      event: string;      // 三到四句话的事件描述,尽量有趣
      category: 'Education' | 'Career' | 'Relationship' | 'Milestone' | 'WorldEvent' | 'Special'; // 事件分类, 'Special' 用于隐藏主线
    }

    请直接返回JSON数组，不要包含任何解释性文字。
  `;

  // 3. 调用AI API
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-72B-Instruct",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2048,
        stream: false,
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`AI API 请求失败，状态码: ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    
    let content = result.choices[0].message.content;
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = content.match(jsonRegex);
    if (match && match[1]) {
      content = match[1];
    }
    const storyEvents: LifeEvent[] = JSON.parse(content);

    return storyEvents;

  } catch (error) {
    console.error("生成人生故事时发生错误:", error);
    return generateMockLifeStory();
  }
};

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
