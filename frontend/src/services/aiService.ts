import { CountryDataExtended, LifeEvent } from '../types';

/**
 * 通过调用AI API生成人生故事。
 * @param countryData - 用于生成故事的扩展国家数据。
 * @returns 返回一个包含人生事件数组的Promise。
 */
export const generateLifeStory = async (countryData: CountryDataExtended): Promise<LifeEvent[]> => {
  const apiKey = process.env.REACT_APP_SILICONFLOW_API_KEY;
  const apiEndpoint = process.env.REACT_APP_SILICONFLOW_ENDPOINT;

  // 检查API密钥和地址是否已在.env文件中配置
  if (!apiKey || !apiEndpoint) {
    console.error("AI API密钥或端点未在.env文件中正确配置。");
    // 在未配置API时，直接返回模拟数据，避免应用崩溃
    return generateMockLifeStory();
  }

  // 1. 设计提示词 (Prompt)
  const prompt = `
    你是一个人生故事生成器。请根据以下关于【${countryData.name}】的数据，
    为一个出生于1990年的人，生成一个符合该国国情的、简短的人生故事。
    
    国家信息:
    - 人均GDP (美元): ${countryData.gdpPerCapita}
    - 主流教育水平: ${countryData.educationLevel}
    - 主要产业: ${countryData.mainIndustries.join(', ')}
    - 文化关键词: ${countryData.culturalKeywords.join(', ')}

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

  // 2. 调用AI API
  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-72B-Instruct", 
        //model: "deepseek-ai/DeepSeek-R1", // 使用文档中明确提到的模型
        messages: [{ role: "user", content: prompt }],
        max_tokens: 8192, // 适当增加最大token数，以防JSON被截断
        stream: false, // 明确要求非流式输出
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`AI API 请求失败，状态码: ${response.status}: ${errorBody}`);
    }

    const result = await response.json();
    
    // API返回的内容通常在 result.choices[0].message.content 中
    // 它可能是一个字符串化的JSON，所以需要解析
    const content = result.choices[0].message.content;
    const storyEvents: LifeEvent[] = JSON.parse(content);

    return storyEvents;

  } catch (error) {
    console.error("生成人生故事时发生错误:", error);
    // 如果真实API调用失败，则降级使用模拟数据
    return generateMockLifeStory();
  }
};

/**
 * 提供一个模拟的人生故事，用于开发和测试。
 * 这在UI开发或API出问题时非常有用。
 * @returns 返回一个预定义的、包含人生事件数组的Promise。
 */
export const generateMockLifeStory = async (): Promise<LifeEvent[]> => {
    console.log("API调用失败或未配置，降级使用模拟AI故事。");
    await new Promise(resolve => setTimeout(resolve, 800)); // 模拟AI思考时间
    return [
        { year: 1995, age: 5, event: "进入本地小学，开始了九年义务教育。", category: 'Education' },
        { year: 2004, age: 14, event: "完成初中学业，进入一所重点高中。", category: 'Education' },
        { year: 2008, age: 18, event: "参加了激烈的高考，并考入了一所不错的大学，学习计算机科学。", category: 'Education' },
        { year: 2012, age: 22, event: "大学毕业，在一家迅速发展的电子商务公司找到了第一份工作。", category: 'Career' },
        { year: 2016, age: 26, event: "经过几年的努力，晋升为项目小组长，并负责一个小团队。", category: 'Career' },
        { year: 2018, age: 28, event: "与相爱多年的伴侣结婚，组建了自己的小家庭。", category: 'Relationship' },
        { year: 2021, age: 31, event: "在工作的城市里，通过努力贷款购买了第一套房子。", category: 'Milestone' },
        { year: 2023, age: 33, event: "孩子出生了，生活进入了一个全新的、充满挑战和喜悦的阶段。", category: 'Relationship' },
    ];
}
