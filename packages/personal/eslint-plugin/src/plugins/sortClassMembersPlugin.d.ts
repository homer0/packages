declare module 'eslint-plugin-sort-class-members' {
  import { Linter } from 'eslint';
  type PluginType = NonNullable<Linter.Config['plugins']>[string];

  const sortClassMembersPluginConfig: PluginType;

  export default sortClassMembersPluginConfig;
}
