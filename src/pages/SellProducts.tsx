
import { useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { X, Search, Plus, Package } from "lucide-react";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Product {
  id: string;
  product_name: string;
  price: number;
  selling_price: number;
  product_quantity: number;
  product_model: string;
  product_image: string | null;
  compatible_vehicles?: string[] | null;
  created_at?: string;
  barcode?: string;
}

interface CartItem extends Product {
  quantity: number;
  sellPrice: number;
  originalPrice: number;
  profit: number;
}

const SellProducts = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      if (!searchQuery || searchQuery.length < 2) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }
      
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .or(`product_name.ilike.%${searchQuery}%,product_model.ilike.%${searchQuery}%`)
          .limit(5);
          
        if (error) throw error;
        
        setSearchResults(data as Product[]);
        setShowResults(true);
      } catch (error: any) {
        console.error('Error searching products:', error);
        toast.error("Failed to search products");
      }
    };
    
    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const getImageUrl = (imageData: string | null): string => {
    return imageData || '/placeholder.svg';
  };

  const addToCart = (product: Product) => {
    if (product.product_quantity <= 0) {
      toast.error(`${product.product_name} is out of stock`);
      return;
    }
    
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === product.id);
      
      if (existingItem) {
        if (existingItem.quantity >= product.product_quantity) {
          toast.error(`Only ${product.product_quantity} units available`);
          return prevItems;
        }
        
        return prevItems.map(item => 
          item.id === product.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                sellPrice: (item.quantity + 1) * item.sellPrice / item.quantity,
                profit: (item.quantity + 1) * item.sellPrice / item.quantity - (item.quantity + 1) * item.originalPrice
              } 
            : item
        );
      } else {
        return [...prevItems, {
          ...product,
          quantity: 1,
          sellPrice: product.selling_price,
          originalPrice: product.price,
          profit: product.selling_price - product.price
        }];
      }
    });
    
    setSearchQuery("");
    setShowResults(false);
    setIsScanning(false);
    
    toast.success(`${product.product_name} added to cart`);
  };

  const removeFromCart = (id: string) => {
    setCartItems(prevItems => prevItems.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity < 1) return;
    
    const product = cartItems.find(item => item.id === id);
    if (!product) return;
    
    if (quantity > product.product_quantity) {
      toast.error(`Only ${product.product_quantity} units available`);
      return;
    }
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              quantity, 
              sellPrice: quantity * (item.sellPrice / item.quantity),
              profit: quantity * (item.sellPrice / item.quantity) - quantity * item.originalPrice
            } 
          : item
      )
    );
  };

  const updatePrice = (id: string, newPrice: number) => {
    if (newPrice < 0) return;
    
    setCartItems(prevItems => 
      prevItems.map(item => 
        item.id === id 
          ? { 
              ...item, 
              sellPrice: newPrice,
              profit: newPrice - (item.quantity * item.originalPrice)
            } 
          : item
      )
    );
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum: number, item: CartItem) => sum + item.sellPrice, 0);
  };

  const calculateTotalProfit = () => {
    return cartItems.reduce((sum: number, item: CartItem) => sum + item.profit, 0);
  };

  const handleGenerateBill = async () => {
    if (!customerName) {
      toast.error("Please enter a customer name");
      return;
    }
    
    if (cartItems.length === 0) {
      toast.error("Please add products to the cart");
      return;
    }

    try {
      const billNumber = `BILL-${Date.now()}`;
      const totalAmount = calculateTotal();
      
      const { data: billData, error: billError } = await supabase
        .from('bills')
        .insert({
          customer_name: customerName,
          vehicle_info: vehicleInfo,
          bill_number: billNumber,
          total_amount: totalAmount
        })
        .select('id')
        .single();
      
      if (billError) throw billError;
      
      const billItems = cartItems.map(item => ({
        bill_id: billData.id,
        product_id: item.id,
        product_name: item.product_name,
        quantity: item.quantity,
        unit_price: item.sellPrice / item.quantity,
        total_price: item.sellPrice
      }));
      
      const { error: itemsError } = await supabase
        .from('bill_items')
        .insert(billItems);
      
      if (itemsError) throw itemsError;
      
      for (const item of cartItems) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ 
            product_quantity: item.product_quantity - item.quantity 
          })
          .eq('id', item.id);
        
        if (updateError) throw updateError;
      }
      
      toast.success(`Bill ${billNumber} generated successfully`);
      
      setCartItems([]);
      setCustomerName("");
      setVehicleInfo("");
      setShowResults(false);
      
    } catch (error) {
      console.error('Error generating bill:', error);
      toast.error("Failed to generate bill");
    }
  };

  return (
    <Layout title="Sell Products">
      <div className="space-y-4 pb-4">
        <div className="flex items-center justify-between px-2">
          <BackButton to="/" />
          <h2 className="text-lg font-semibold md:hidden">Create New Bill</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr,400px] px-2">
          {/* Customer & Search Section */}
          <Card className="order-2 md:order-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Customer Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Customer Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter customer name"
                    className="h-12 text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Vehicle Information
                  </label>
                  <Input
                    value={vehicleInfo}
                    onChange={(e) => setVehicleInfo(e.target.value)}
                    placeholder="Vehicle model/year"
                    className="h-12 text-base"
                  />
                </div>
                
                <div className="relative" ref={searchRef}>
                  <label className="block text-sm font-medium mb-1">
                    Search Products
                  </label>
                  <div className="relative">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or model..."
                      className="h-12 text-base pr-12"
                    />
                    <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  
                  {showResults && searchResults.length > 0 && (
                    <div className="absolute z-20 w-full mt-2 bg-white shadow-xl rounded-lg border overflow-hidden">
                      {searchResults.map((product) => (
                        <div 
                          key={product.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b last:border-0"
                          onClick={() => addToCart(product)}
                        >
                          <div className="flex items-center space-x-3">
                            <img 
                              src={getImageUrl(product.product_image)} 
                              alt={product.product_name}
                              className="w-12 h-12 object-cover rounded-lg" 
                            />
                            <div>
                              <p className="font-medium text-base">{product.product_name}</p>
                              <p className="text-sm text-gray-500">
                                {product.product_model} • ₹{product.selling_price}
                                <span className={`ml-2 ${
                                  product.product_quantity > 3 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {product.product_quantity} in stock
                                </span>
                              </p>
                            </div>
                          </div>
                          <Plus className="h-5 w-5 text-blue-600" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cart Section */}
          <Card className="order-1 md:order-2 sticky top-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Order Summary</CardTitle>
                <Badge variant="secondary" className="text-sm">
                  {cartItems.length} Items
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {cartItems.length > 0 ? (
                <div className="mt-2">
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-start space-x-3 p-2 rounded-lg bg-muted/30">
                        <img 
                          src={getImageUrl(item.product_image)} 
                          alt={item.product_name}
                          className="w-12 h-12 object-cover rounded-lg" 
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-medium truncate">{item.product_name}</p>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.product_model}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-xs text-muted-foreground mb-0.5">
                                Quantity
                              </label>
                              <Input
                                type="number"
                                min={1}
                                value={item.quantity}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuantity(item.id, parseInt(e.target.value))}
                                className="h-7 text-sm"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs text-muted-foreground mb-0.5">
                                Price (₹)
                              </label>
                              <Input
                                type="number"
                                min={0}
                                value={item.sellPrice}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePrice(item.id, parseFloat(e.target.value))}
                                className="h-7 text-sm"
                              />
                            </div>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Cost: ₹{(item.originalPrice * item.quantity).toFixed(2)}</span>
                            <span className={`font-medium ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Profit: ₹{item.profit.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Amount</span>
                      <span className="font-medium">₹{calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Profit</span>
                      <span className={calculateTotalProfit() >= 0 ? 'text-green-600' : 'text-red-600'}>
                        ₹{calculateTotalProfit().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4"
                    onClick={handleGenerateBill}
                  >
                    Generate Bill
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Package className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                  <h3 className="text-sm font-medium mb-1">Cart is Empty</h3>
                  <p className="text-xs text-muted-foreground">
                    Search for products to add to cart
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SellProducts;
