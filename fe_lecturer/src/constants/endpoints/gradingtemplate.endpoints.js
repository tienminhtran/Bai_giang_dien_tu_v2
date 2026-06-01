const GRADING_TEMPLATE = {
  LIST:   '/grading-criteria-templates',
  DETAIL: (id) => `/grading-criteria-templates/${id}`,
  CREATE: '/grading-criteria-templates',
  UPDATE: (id) => `/grading-criteria-templates/${id}`,
  DELETE: (id) => `/grading-criteria-templates/${id}`,

  // Tiêu chí con (grading_criteria_items)
  ITEMS:        (id) => `/grading-criteria-templates/${id}/items`,
  ITEMS_IMPORT: (id) => `/grading-criteria-templates/${id}/items/import`,
  ITEM:         (id, itemId) => `/grading-criteria-templates/${id}/items/${itemId}`,
}

export default GRADING_TEMPLATE
