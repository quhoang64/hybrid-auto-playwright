import { BasePage } from '@base/BasePage';

export class FormLayoutsPage extends BasePage {
  async submitInlineFormWithNameAndEmail(name: string, email: string) {
    const inlineForm = this.page.getByRole('region', { name: 'Inline form' });
    await inlineForm.getByPlaceholder('Jane Doe').fill(name);
    await inlineForm.getByPlaceholder('Email').fill(email);
    await inlineForm.getByRole('button').click();
  }

  async submitBasicFormWithEmailAndPassword(email: string, password: string) {
    const basicForm = this.page.getByRole('region', { name: 'Basic form' });
    await basicForm.getByPlaceholder('Email').fill(email);
    await basicForm.getByPlaceholder('Password').fill(password);
    await basicForm.getByRole('button', { name: 'Sign in' }).click();
  }
}
