const GRADING_TEAM = {
  LIST:     '/grading-teams',
  DETAIL:   (id) => `/grading-teams/${id}`,
  CREATE:   '/grading-teams',
  ASSIGN:   (id) => `/grading-teams/${id}/assign`,
  UNASSIGN: (id) => `/grading-teams/${id}/unassign`,
  DELETE:   (id) => `/grading-teams/${id}`,
}

export default GRADING_TEAM
