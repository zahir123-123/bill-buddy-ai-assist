
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

const Layout = ({ children, title, className }: LayoutProps) => {
  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-900", className)}>
      {title && (
        <div className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold hidden md:block">{title}</h1>
          </div>
        </div>
      )}
      <div className="container mx-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;
