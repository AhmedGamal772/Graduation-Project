import React, { ReactNode } from 'react';
import MainLayout from './MainLayout';

interface MainLayoutWrapperProps {
  children: ReactNode;
}

const MainLayoutWrapper: React.FC<MainLayoutWrapperProps> = ({ children }) => {
  // Recursively clean child components to remove any text nodes containing just numbers
  const cleanChildren = (children: ReactNode): ReactNode => {
    return React.Children.map(children, child => {
      // If it's a valid React element, recursively clean its children
      if (React.isValidElement(child) && child.props.children) {
        // Clone the element with cleaned children
        return React.cloneElement(
          child,
          { ...child.props },
          cleanChildren(child.props.children)
        );
      }
      
      // If it's a valid React element without children, keep it as is
      if (React.isValidElement(child)) {
        return child;
      }
      
      // For text nodes, filter out any that are just numbers
      if (child !== null && child !== undefined) {
        const childStr = String(child).trim();
        // Filter out text nodes that are just numbers
        if (/^\d+$/.test(childStr)) {
          return null;
        }
      }
      
      return child;
    });
  };

  const sanitizedChildren = cleanChildren(children);

  return <MainLayout>{sanitizedChildren}</MainLayout>;
};

export default MainLayoutWrapper; 