
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface SaleDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (details: SaleDetails) => void;
}

interface SaleDetails {
  customerName: string;
  vehicleInfo: string;
  productName: string;
  quantity: number;
  price: number;
}

const SaleDetailsDialog = ({ isOpen, onClose, onSave }: SaleDetailsDialogProps) => {
  const [details, setDetails] = useState<SaleDetails>({
    customerName: "",
    vehicleInfo: "",
    productName: "",
    quantity: 1,
    price: 0,
  });

  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const updateField = (field: keyof SaleDetails, value: string | number) => {
    setDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step === 1 && !details.customerName) {
      toast.error("Please enter customer name");
      return;
    }
    
    if (step === 2 && !details.productName) {
      toast.error("Please enter product name");
      return;
    }
    
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSave();
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      // Simulating an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(details);
      toast.success("Sale details saved successfully!");
      
      // Reset and close
      setDetails({
        customerName: "",
        vehicleInfo: "",
        productName: "",
        quantity: 1,
        price: 0,
      });
      setStep(1);
      onClose();
    } catch (error) {
      toast.error("Failed to save sale details");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">
            {step === 1 ? "Customer Details" : 
             step === 2 ? "Product Details" : 
             "Confirm Sale"}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="p-5 space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Customer Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={details.customerName}
                  onChange={(e) => updateField("customerName", e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Vehicle Information
                </label>
                <Input
                  value={details.vehicleInfo}
                  onChange={(e) => updateField("vehicleInfo", e.target.value)}
                  placeholder="Vehicle model/year"
                />
              </div>
            </>
          )}
          
          {step === 2 && (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <Input
                  value={details.productName}
                  onChange={(e) => updateField("productName", e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Quantity
                </label>
                <Input
                  type="number"
                  min={1}
                  value={details.quantity}
                  onChange={(e) => updateField("quantity", parseInt(e.target.value) || 1)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Price
                </label>
                <Input
                  type="number"
                  min={0}
                  value={details.price}
                  onChange={(e) => updateField("price", parseFloat(e.target.value) || 0)}
                />
              </div>
            </>
          )}
          
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium">Review Sale Details</h3>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-md space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer:</span>
                  <span className="font-medium">{details.customerName}</span>
                </div>
                
                {details.vehicleInfo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vehicle:</span>
                    <span>{details.vehicleInfo}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Product:</span>
                  <span>{details.productName}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Quantity:</span>
                  <span>{details.quantity}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-500">Price:</span>
                  <span>₹{details.price.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-medium">₹{(details.quantity * details.price).toFixed(2)}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500">
                Would you like to save this sale?
              </p>
            </div>
          )}
        </div>
        
        <div className="flex justify-between p-4 border-t bg-gray-50 dark:bg-gray-900">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          
          <Button 
            onClick={handleNext}
            disabled={isSaving}
          >
            {step < 3 ? "Next" : "Save Sale"}
            {isSaving && "..."}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SaleDetailsDialog;
