export interface GovernedDefinition {
  term: string;
  formula: string;
  version: number;
  ownerId: string;
  state: "draft" | "approved" | "retired";
}

export class GovernedDefinitionsRegistry {
  private readonly definitions: Map<string, GovernedDefinition>;

  constructor(definitions: readonly GovernedDefinition[]) {
    this.definitions = new Map(
      definitions
        .filter((definition) => definition.state === "approved")
        .map((definition) => [definition.term.toLocaleLowerCase(), definition]),
    );
  }

  resolve(term: string): GovernedDefinition {
    const definition = this.definitions.get(term.trim().toLocaleLowerCase());
    if (!definition) {
      throw new Error(
        `Governed term "${term}" has no approved definition; free-form inference is blocked.`,
      );
    }
    return definition;
  }

  has(term: string): boolean {
    return this.definitions.has(term.trim().toLocaleLowerCase());
  }
}
