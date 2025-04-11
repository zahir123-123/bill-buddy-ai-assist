
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BackButtonProps {
  to: string;
}

const BackButton = ({ to }: BackButtonProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="flex items-center text-muted-foreground hover:text-foreground"
      asChild
    >
      <Link to={to}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Link>
    </Button>
  );
};

export default BackButton;
