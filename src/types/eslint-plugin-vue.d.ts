declare module 'eslint-plugin-vue/lib/utils' {
  import { RuleListener, RuleContext } from '@typescript-eslint/utils/dist/ts-eslint/Rule';
  function defineTemplateBodyVisitor<TMessageIds extends string, TOptions extends readonly unknown[]>(
    context: Readonly<RuleContext<TMessageIds, TOptions>>,
    templateBodyVisitor: { [key: string]: (...args: any) => void },
    scriptVisitor?: RuleListener,
    options?: { templateBodyTriggerSelector: 'Program' | 'Program:exit' },
  ): RuleListener;
}
