export class CreatePositionCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
    public readonly parentId: string | null,
  ) {}
}
