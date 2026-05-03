export function serializeUser(row) {
  if (!row) return null;
  return {
    _id: String(row.id),
    id: String(row.id),
    name: row.name,
    email: row.email
  };
}

export function serializeProject(row, members = []) {
  return {
    _id: String(row.id),
    name: row.name,
    description: row.description,
    creator: String(row.creator_id),
    members,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function serializeTask(row) {
  return {
    _id: String(row.id),
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    priority: row.priority,
    status: row.status,
    project: String(row.project_id),
    assignedTo: row.assigned_to_id ? {
      _id: String(row.assigned_to_id),
      id: String(row.assigned_to_id),
      name: row.assigned_to_name,
      email: row.assigned_to_email
    } : String(row.assigned_to),
    createdBy: row.created_by_id ? {
      _id: String(row.created_by_id),
      id: String(row.created_by_id),
      name: row.created_by_name,
      email: row.created_by_email
    } : String(row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
