/* tslint:disable */
const schema = {
  description: 'The schema for a question config',
  title: 'config.json',
  type: 'object',
  properties: {
    weights: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          weight: {
            type: 'string'
          }
        },
        required: ['id', 'weight']
      }
    },
    langs: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    elements: {
      type: 'object',
      patternProperties: {
        ".{1,}": { type: 'string' }
      }
    },
    models: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          element: {
            type: 'string'
          }
        },
        required: [
          'id', 'element'
        ]
      }
    }
  },
  required: [
    'elements'
  ]
};

export default schema;
