import inquirer from 'inquirer';
import type { FindAllSchema, MatchCondition } from '../types/findall.js';

export class SchemaEditor {
  constructor(private schema: FindAllSchema) {}

  async edit(): Promise<FindAllSchema> {
    console.log('\n📋 Generated Schema Preview:\n');
    this.displaySchema();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Use as-is', value: 'use' },
          { name: 'Edit objective', value: 'edit-objective' },
          { name: 'Edit entity type', value: 'edit-entity' },
          { name: 'Edit match conditions', value: 'edit-conditions' },
          { name: 'View full JSON', value: 'view-json' },
        ],
      },
    ]);

    switch (action) {
      case 'use':
        return this.schema;
      case 'edit-objective':
        await this.editObjective();
        return this.edit();
      case 'edit-entity':
        await this.editEntityType();
        return this.edit();
      case 'edit-conditions':
        await this.editMatchConditions();
        return this.edit();
      case 'view-json':
        console.log('\n' + JSON.stringify(this.schema, null, 2) + '\n');
        return this.edit();
      default:
        return this.schema;
    }
  }

  private displaySchema(): void {
    console.log(`Objective: ${this.schema.objective}`);
    console.log(`Entity Type: ${this.schema.entity_type}`);
    console.log(`\nMatch Conditions (${this.schema.match_conditions.length}):`);
    
    this.schema.match_conditions.forEach((condition, i) => {
      console.log(`\n  ${i + 1}. ${condition.name}`);
      console.log(`     ${condition.description}`);
    });
    console.log('');
  }

  private async editObjective(): Promise<void> {
    const { objective } = await inquirer.prompt([
      {
        type: 'input',
        name: 'objective',
        message: 'Enter new objective:',
        default: this.schema.objective,
      },
    ]);

    this.schema.objective = objective;
  }

  private async editEntityType(): Promise<void> {
    const { entityType } = await inquirer.prompt([
      {
        type: 'input',
        name: 'entityType',
        message: 'Enter entity type (plural noun):',
        default: this.schema.entity_type,
      },
    ]);

    this.schema.entity_type = entityType;
  }

  private async editMatchConditions(): Promise<void> {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'Match Conditions:',
        choices: [
          { name: 'Add condition', value: 'add' },
          { name: 'Edit condition', value: 'edit' },
          { name: 'Remove condition', value: 'remove' },
          { name: 'Back', value: 'back' },
        ],
      },
    ]);

    switch (action) {
      case 'add':
        await this.addMatchCondition();
        return this.editMatchConditions();
      case 'edit':
        await this.editMatchCondition();
        return this.editMatchConditions();
      case 'remove':
        await this.removeMatchCondition();
        return this.editMatchConditions();
      case 'back':
        return;
    }
  }

  private async addMatchCondition(): Promise<void> {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Condition name (identifier):',
        validate: (input) => input.trim().length > 0 || 'Name is required',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Condition description (be specific):',
        validate: (input) => input.trim().length > 0 || 'Description is required',
      },
    ]);

    this.schema.match_conditions.push(answers as MatchCondition);
    console.log('✓ Condition added');
  }

  private async editMatchCondition(): Promise<void> {
    const { index } = await inquirer.prompt([
      {
        type: 'list',
        name: 'index',
        message: 'Select condition to edit:',
        choices: this.schema.match_conditions.map((c, i) => ({
          name: `${c.name}: ${c.description.slice(0, 60)}...`,
          value: i,
        })),
      },
    ]);

    const condition = this.schema.match_conditions[index];
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Condition name:',
        default: condition.name,
      },
      {
        type: 'input',
        name: 'description',
        message: 'Condition description:',
        default: condition.description,
      },
    ]);

    this.schema.match_conditions[index] = answers as MatchCondition;
    console.log('✓ Condition updated');
  }

  private async removeMatchCondition(): Promise<void> {
    const { index } = await inquirer.prompt([
      {
        type: 'list',
        name: 'index',
        message: 'Select condition to remove:',
        choices: this.schema.match_conditions.map((c, i) => ({
          name: `${c.name}: ${c.description.slice(0, 60)}...`,
          value: i,
        })),
      },
    ]);

    this.schema.match_conditions.splice(index, 1);
    console.log('✓ Condition removed');
  }
}