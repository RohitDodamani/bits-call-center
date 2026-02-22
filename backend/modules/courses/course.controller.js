const Course = require('../../models/Course');

exports.getCourses = async (req, res) => {
    try {
        const courses = await Course.find({ isActive: true });
        res.json(courses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.createCourse = async (req, res) => {
    const course = new Course({
        name: req.body.name,
        description: req.body.description,
        category: req.body.category
    });

    try {
        const newCourse = await course.save();
        res.status(201).json(newCourse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateCourse = async (req, res) => {
    console.log('PUT /api/courses/' + req.params.id, req.body);
    try {
        const { name, description, category } = req.body;
        const updatedCourse = await Course.findByIdAndUpdate(
            req.params.id,
            { name, description, category },
            { new: true }
        );
        if (!updatedCourse) return res.status(404).json({ message: 'Course not found' });
        res.json(updatedCourse);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: 'Course deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
