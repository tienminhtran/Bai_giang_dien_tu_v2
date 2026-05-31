const express = require('express');
const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API đang hoạt động', timestamp: new Date() });
});

router.use('/auth', require('./auth.routes'));
router.use('/students', require('./student.routes'));

// router.use('/users', require('./user.routes'));
router.use('/courses', require('./course.routes'));
router.use('/course-roles', require('./courseroles.routes'));
router.use('/faculties',       require('./faculty.routes'));
router.use('/majors',          require('./major.routes'));
router.use('/academic-degrees', require('./academicDegree.routes'));
router.use('/lectures',   require('./lecture.routes'));
router.use('/user-roles',  require('./userrole.routes'));
router.use('/enrollments',    require('./enrollment.routes'));
router.use('/academic-terms',    require('./academicterm.routes'));
router.use('/course-lecturers',  require('./courselecturer.routes'));
router.use('/department-head',   require('./departmentHead.routes'));
router.use('/grading-rounds',    require('./gradinground.routes'));

module.exports = router;
