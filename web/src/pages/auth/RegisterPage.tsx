import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import FormField, { SelectField } from '../../components/ui/FormField';
import Button from '../../components/ui/Button';

const RegisterSchema = Yup.object().shape({
  name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .required('Name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  role: Yup.string()
    .oneOf(['admin', 'instructor', 'student'], 'Invalid role')
    .required('Role is required'),
});

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'instructor', label: 'Instructor' },
  { value: 'student', label: 'Student' },
];

const RegisterPage: React.FC = () => {
  const { register, isAuthenticated, isLoading } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <BookOpen className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Formik
            initialValues={{
              name: '',
              email: '',
              password: '',
              role: '',
            }}
            validationSchema={RegisterSchema}
            onSubmit={async (values, { setSubmitting }) => {
              try {
                await register(values);
              } catch (error) {
                console.error('Registration error:', error);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-6">
                <FormField
                  label="Full Name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                />

                <FormField
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />

                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                />

                <SelectField
                  label="Role"
                  name="role"
                  options={roleOptions}
                  required
                />

                <div>
                  <Button
                    type="submit"
                    isLoading={isSubmitting || isLoading}
                    disabled={isSubmitting || isLoading}
                    fullWidth
                  >
                    Register
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;