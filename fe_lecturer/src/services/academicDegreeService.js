import api from '../api/axios'
import ACADEMIC_DEGREE_EP from '../constants/endpoints/academicDegree.endpoints'

const toFrontend = (d) => ({ id: d.id, degreeName: d.degree_name })

const list = async () => {
  const res = await api.get(ACADEMIC_DEGREE_EP.LIST)
  return res.data.data.map(toFrontend)
}

const create = async ({ degreeName }) => {
  const res = await api.post(ACADEMIC_DEGREE_EP.CREATE, { degree_name: degreeName?.trim() })
  return res.data
}

const remove = async (id) => {
  const res = await api.delete(`${ACADEMIC_DEGREE_EP.DELETE}/${id}`)
  return res.data
}

export default { list, create, remove }
