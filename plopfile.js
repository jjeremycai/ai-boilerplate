export default function (plop) {
  // Endpoint generator
  plop.setGenerator('endpoint', {
    description: 'Create a new API endpoint',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Endpoint name (e.g., users, products):',
        validate: (input) => input.length > 0 || 'Name is required'
      },
      {
        type: 'list',
        name: 'methods',
        message: 'HTTP methods to include:',
        choices: [
          { name: 'GET only (read)', value: 'get' },
          { name: 'GET + POST (read + create)', value: 'get-post' },
          { name: 'Full CRUD (GET, POST, PATCH, DELETE)', value: 'crud' }
        ]
      },
      {
        type: 'confirm',
        name: 'useAuth',
        message: 'Require authentication?',
        default: true
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'worker/src/routes/{{dashCase name}}.ts',
        templateFile: 'templates/endpoint.hbs'
      },
      {
        type: 'modify',
        path: 'worker/src/routes/index.ts',
        pattern: /(\/\/ Add new routes here)/,
        template: 'import { {{camelCase name}}Routes } from \'./{{dashCase name}}\'\n$1'
      },
      {
        type: 'modify',
        path: 'worker/src/routes/index.ts',
        pattern: /(\/\/ Register new routes here)/,
        template: 'api.route(\'/{{dashCase name}}\', {{camelCase name}}Routes)\n$1'
      }
    ]
  });

  // Model generator
  plop.setGenerator('model', {
    description: 'Create a new database model',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Model name (singular, e.g., User, Product):',
        validate: (input) => input.length > 0 || 'Name is required'
      },
      {
        type: 'input',
        name: 'fields',
        message: 'Fields (comma-separated, e.g., name:string, age:number):',
        validate: (input) => input.length > 0 || 'At least one field is required'
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'shared/types/{{dashCase name}}.ts',
        templateFile: 'templates/model.hbs'
      },
      {
        type: 'add',
        path: 'worker/src/db/migrations/{{timestamp}}_create_{{dashCase name}}.sql',
        templateFile: 'templates/migration.hbs'
      },
      {
        type: 'modify',
        path: 'shared/types/index.ts',
        pattern: /(\/\/ Add new types here)/,
        template: 'export * from \'./{{dashCase name}}\'\n$1'
      }
    ]
  });

  // Migration generator
  plop.setGenerator('migration', {
    description: 'Create a new database migration',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Migration name (e.g., add_user_avatar, update_project_status):',
        validate: (input) => input.length > 0 || 'Name is required'
      },
      {
        type: 'list',
        name: 'type',
        message: 'Migration type:',
        choices: [
          { name: 'Create table', value: 'create' },
          { name: 'Alter table', value: 'alter' },
          { name: 'Custom SQL', value: 'custom' }
        ]
      }
    ],
    actions: [
      {
        type: 'add',
        path: 'worker/src/db/migrations/{{timestamp}}_{{snakeCase name}}.sql',
        templateFile: 'templates/migration-{{type}}.hbs'
      }
    ]
  });

  // Helper to generate timestamp
  plop.setHelper('timestamp', () => {
    return new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  });
}