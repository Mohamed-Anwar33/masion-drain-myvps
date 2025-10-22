import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Filter, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { categories } from "@/data/products";

interface CategoryFilterProps {
  currentLang: 'en' | 'ar';
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  selectedPriceRange: string;
  onPriceRangeChange: (range: string) => void;
  productCount: number;
}

export function CategoryFilter({
  currentLang,
  selectedCategory,
  onCategoryChange,
  selectedPriceRange,
  onPriceRangeChange,
  productCount
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const priceRanges = [
    { value: "all", label: { en: "All Prices", ar: "كل الأسعار" } },
    { value: "0-100", label: { en: "Under $100", ar: "أقل من $100" } },
    { value: "100-150", label: { en: "$100 - $150", ar: "$100 - $150" } },
    { value: "150-200", label: { en: "$150 - $200", ar: "$150 - $200" } },
    { value: "200", label: { en: "$200+", ar: "$200+" } }
  ];

  const clearFilters = () => {
    onCategoryChange('all');
    onPriceRangeChange('all');
  };

  const hasActiveFilters = selectedCategory !== 'all' || selectedPriceRange !== 'all';

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {currentLang === 'ar' ? "الفلاتر" : "Filters"}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-sm">
              {productCount} {currentLang === 'ar' ? "منتج" : "products"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Filter className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="space-y-6">
              {/* Categories */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                  {currentLang === 'ar' ? "الفئات" : "Categories"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onCategoryChange('all')}
                    className="text-xs"
                  >
                    {currentLang === 'ar' ? "الكل" : "All"}
                  </Button>
                  {Object.entries(categories).map(([key, category]) => (
                    <Button
                      key={key}
                      variant={selectedCategory === key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onCategoryChange(key)}
                      className="text-xs"
                    >
                      {category[currentLang]}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Price Ranges */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">
                  {currentLang === 'ar' ? "نطاق السعر" : "Price Range"}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {priceRanges.map((range) => (
                    <Button
                      key={range.value}
                      variant={selectedPriceRange === range.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPriceRangeChange(range.value)}
                      className="text-xs"
                    >
                      {range.label[currentLang]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="pt-2"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {currentLang === 'ar' ? "مسح الفلاتر" : "Clear Filters"}
                  </Button>
                </motion.div>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
