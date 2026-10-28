export function assignmentPhaseLabel(phase: string): string {
  switch (phase) {
    case "LoadIn":
      return "Load-in";
    case "LoadOut":
      return "Load-out";
    default:
      return phase;
  }
}

export function assignmentRoleLabel(role: string): string {
  return role.replace(/([a-z])([A-Z])/g, "$1 $2");
}
