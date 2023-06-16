'use strict';
require('dotenv').config();

/**
 * function-interface controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const { Configuration, OpenAIApi } = require('openai');

module.exports = createCoreController('api::function-interface.function-interface', ({ strapi }) =>  ({
    async create(ctx) {
      // some logic here
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      const openai = new OpenAIApi(configuration);

      const res = await openai.createChatCompletion({
        model: "gpt-3.5-turbo-0613",
        messages: [{ role: "user", content: `${ctx.request.body.data.name} 함수 만들어줘  (창의적으로 생각해서 필요할만한 매개변수 전부 추가)` }],
        functions: [{
          "name": "create_gpt_function_interface",
          "description": "A function that creates a ChatGPT function interface structure.",
          "parameters": {
            "type": "object",
            "properties": {
              "name": { "type": "string", "description": "The name of the function." },
              "description": { "type": "string", "description": "A description of the function.(translate korean)" },
              "parameters_properties": { "type": "string", "description": "The properties of the parameters required by the function.(JSON Schema) (required)description korean" },
              "parameters_required": { "type": "array", "items": {"type": "string"}, "description": "The list of parameters required by the function." }
            },
            "required": ["name", "description", "parameters_properties", "parameters_required"]
          }
        }],
        function_call: 'auto',
        temperature: 1
      });
  
      // 함수 호출이 없으면 챗봇 응답을 반환합니다.
      const { finish_reason, message: responseMessage } = res.data.choices[0];
      console.log(res.data.choices[0]);
      // if (finish_reason === 'stop') return responseMessage;
  
      // 호출된 함수가 등록되어 있는지 확인하고 실행합니다.
      if (finish_reason === 'function_call') {
        const functionCall = responseMessage.function_call;
        const { name, description, parameters_properties, parameters_required } = JSON.parse(functionCall.arguments);
        const _interface = {
          "name": name,
          "description": description,
          "parameters": {
            "type": "object",
            "properties": parameters_properties,
            "required": parameters_required
          }
        };
        console.log(_interface);
  
        // Create the response here using the fetched data from ChatGPT API
        ctx.request.body.data.interface = _interface;
        ctx.request.body.data.description = _interface.description;
        const response = await super.create(ctx);
        // Update or process the response as needed
        console.log(response);
        
        return response;
      }
      
      return null; // Return an appropriate value if no response is created
    }
}));
  
