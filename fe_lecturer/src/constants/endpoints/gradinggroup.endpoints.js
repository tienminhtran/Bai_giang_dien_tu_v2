const GRADING_GROUP = {
  LIST:        '/grading-groups',
  DETAIL:      (id) => `/grading-groups/${id}`,
  ROUND_SETUP: (roundId) => `/grading-groups/round/${roundId}/setup`,
  CREATE:      '/grading-groups',
  BULK:        '/grading-groups/bulk',
  UPDATE:      (id) => `/grading-groups/${id}`,
  DELETE:      (id) => `/grading-groups/${id}`,

  MEMBERS:     (id) => `/grading-groups/${id}/members`,
  MEMBER:      (id, memberId) => `/grading-groups/${id}/members/${memberId}`,
}

export default GRADING_GROUP
