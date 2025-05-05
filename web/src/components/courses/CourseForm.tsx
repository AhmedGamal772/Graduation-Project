import React from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import FormField, { TextAreaField } from '../ui/FormField';
import Button from '../ui/Button';
import { Course } from '../../types';

interface CourseFormProps {
  initialValues?: Partial<Course>;
  onSubmit: (values: Partial<Course>) => Promise<void>;
  isLoading: boolean;
  isDarkMode?: boolean;
}

const CourseSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters')
    .required('Title is required'),
  description: Yup.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .required('Description is required'),
  instructorId: Yup.string()
    .nullable(),
});

const CourseForm: React.FC<CourseFormProps> = ({ 
  initialValues = { title: '', description: '' }, 
  onSubmit,
  isLoading,
  isDarkMode = false,
}) => {
  return (
    <Formik
      initialValues={initialValues}
      validationSchema={CourseSchema}
      onSubmit={async (values, { setSubmitting }) => {
        try {
          await onSubmit(values);
        } catch (error) {
          console.error('Error submitting form:', error);
        } finally {
          setSubmitting(false);
        }
      }}
    >
      {({ isSubmitting }) => (
        <Form className="space-y-4">
          <FormField
            label="Course Title"
            name="title"
            type="text"
            placeholder="Enter course title"
            required
            isDarkMode={isDarkMode}
          />
          
          <TextAreaField
            label="Course Description"
            name="description"
            placeholder="Enter course description"
            rows={4}
            required
            isDarkMode={isDarkMode}
          />
          
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={isSubmitting || isLoading}
              disabled={isSubmitting || isLoading}
              variant={isDarkMode ? "dark" : "primary"}
            >
              {initialValues.id ? 'Update Course' : 'Create Course'}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default CourseForm;