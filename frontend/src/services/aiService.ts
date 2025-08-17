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

  const prompt = `### 角色扮演
你是一位富有创造力的故事叙述者和世界级的游戏设计师，专精于为年轻人（1995-2005年出生）创作引人入胜、充满网络梗和时代印记的文本类人生模拟游戏。

### 核心任务
根据下方提供的【${countryData.name}】国家数据，为一名出生于 **1995年到2005年** 的虚构角色，生成一段从童年到未来到死亡的、充满趣味和可能性的精彩人生故事。

### 数据锚点 (StorySeed)
这是指导故事走向的真实世界数据。请将这些数据作为**统计学上的锚点**，来影响主角人生的关键决策和概率。

\`\`\`json
${JSON.stringify(countryData.storySeed, null, 2)}
\`\`\`

**数据使用规则:**
1.  **数据存在时**: 严格参考数据。例如，如果 \`university_rate\` 是 \`0.42\`，那么主角上大学的概率就应该是中等偏下。如果 \`main_industries\` 包含 "IT服务"，那么主角从事相关职业的可能性就更高。
2.  **数据缺失时 (\`null\` 或字段不存在)**: 这是你发挥创造力的时刻！**你必须利用你对世界的广泛认知，为【${countryData.name}】做出合理且有趣的推断**。例如，如果 \`historicalEvents\` 为空，你可以自行加入全球青年熟知的事件，如智能手机的普及、社交媒体的兴起、某款现象级游戏（如《原神》）的发布、或是ChatGPT的诞生。

### 故事风格与要求
- **时代感与趣味性**: 故事必须有强烈的时代感，巧妙地融入全球性的流行文化、网络梗、科技变革和社会事件。不要写成干巴巴的流水账。
- **共鸣**: 聚焦普通人的生活体验：尴尬的学生时代、第一份工作的迷茫、经营人际关系、面对社会热点事件的反应等。
- **惊喜感 (隐藏主线)**: 有 **5%** 的概率，故事会偏离正常轨道，触发一条**“隐藏主线”**。这应该是一个意想不到的、充满想象力的转折。例如：
    - 发现自己拥有某种不为人知的超能力（例如，能和猫说话）。
    - 卷入某个大事件
    - 欧气爆表玩游戏崩坏星穹铁道白厄卡池十连七金直接满命白厄，自此成了二游史上最欧的玩家。每一个人抽卡前都要拜你的画像，逝世100年后直接性转进卡池强度爆表。
    当触发隐藏主线时，后续事件应围绕这条主线展开。

### 输出格式 (严格要求)
你 **必须** 以 **换行符分隔的JSON (NDJSON)** 格式进行输出。
- **不要** 使用JSON数组的 \`[\` 和 \`]\`。
- 每生成一个人生事件对象，就立即将其作为**一行**输出，并以换行符 \`\\n\` 结尾。
- 每个输出的行都必须是一个**完整且独立**的JSON对象。
- **不要** 在对象之间添加逗号。
- 输出的JSON对象必须严格遵循以下TypeScript接口定义：

\`\`\`typescript
interface LifeEvent {
  year: number;       // 事件发生的年份
  age: number;        // 当事人当时的年龄
  event: string;      // 60字的生动事件描述
  category: 'Education' | 'Career' | 'Relationship' | 'Milestone' | 'WorldEvent' | 'Special'; // 事件分类, 'Special' 用于隐藏主线
  imgPrompt?: string; // (可选) 为这个事件生成一张配图的AI绘画提示词，风格：动漫，赛璐璐
}
\`\`\`

**示例输出:**
{"year": 1998, "age": 3, "event": "...", "category": "Milestone"}
{"year": 2001, "age": 6, "event": "...", "category": "Education"}
{"year": 2014, "age": 19, "event": "...", "category": "Education", "imgPrompt": "..."}

**现在，请开始生成故事。**
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
        model: "deepseek-ai/DeepSeek-R1",
        messages: [{ role: "user", content: prompt }],
         response_format: { type: "json_object" }, // 明确要求JSON格式
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
    let contentBuffer = ''; // Buffer for potentially fragmented JSON objects

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      
      buffer += decoder.decode(value, { stream: true });
      
      // The response is a Server-Sent Event (SSE) stream.
      // We need to process it line by line.
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last, possibly incomplete line.

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          if (data.trim() === '[DONE]') {
            // Stream finished
            break;
          }
          try {
            const parsed = JSON.parse(data);
            const deltaContent = parsed.choices[0]?.delta?.content;
            if (deltaContent) {
              contentBuffer += deltaContent;
              // Try to parse the buffered content
              // This is a simple approach; a more robust one would handle nested objects.
              try {
                  const lifeEvent: LifeEvent = JSON.parse(contentBuffer);
                  // If parsing succeeds, we have a complete object.
                  onEventReceived(lifeEvent);
                  contentBuffer = ''; // Reset buffer for the next object
              } catch (e) {
                  // JSON is not yet complete, continue accumulating.
              }
            }
          } catch (e) {
            // Ignore parsing errors for individual chunks
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
