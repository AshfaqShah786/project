import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Home, Bed, Bath, Square, Phone, Mail } from "lucide-react";

interface PropertyCardProps {
  property: {
    id: number;
    title: string;
    description?: string;
    action: string;
    category: string;
    type: string;
    location: string;
    city: string;
    state: string;
    price: string;
    area?: string;
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
    contactPhone?: string;
    contactEmail?: string;
  };
}

export function PropertyCard({ property }: PropertyCardProps) {
  const formatPrice = (price: string) => {
    const num = Number(price);
    if (num >= 10000000) {
      return `₹${(num / 10000000).toFixed(1)} Cr`;
    } else if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)} L`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
            {property.title}
          </CardTitle>
          <Badge variant={property.action === 'buy' ? 'default' : 'secondary'} className="ml-2">
            {property.action === 'buy' ? 'For Sale' : 'For Rent'}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{property.location}, {property.city}</span>
          </div>
          <div className="flex items-center gap-1">
            <Home className="h-4 w-4" />
            <span className="capitalize">{property.type}</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {property.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{property.description}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-green-600">
            {formatPrice(property.price)}
            {property.action === 'rent' && <span className="text-sm font-normal text-gray-500">/month</span>}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            {property.area && (
              <div className="flex items-center gap-1">
                <Square className="h-4 w-4" />
                <span>{property.area} sq ft</span>
              </div>
            )}
            {property.bedrooms && (
              <div className="flex items-center gap-1">
                <Bed className="h-4 w-4" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms && (
              <div className="flex items-center gap-1">
                <Bath className="h-4 w-4" />
                <span>{property.bathrooms}</span>
              </div>
            )}
          </div>
        </div>

        {property.amenities && property.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {property.amenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {amenity}
              </Badge>
            ))}
            {property.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{property.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3 text-xs text-gray-500">
            {property.contactPhone && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                <span>{property.contactPhone}</span>
              </div>
            )}
            {property.contactEmail && (
              <div className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span>{property.contactEmail}</span>
              </div>
            )}
          </div>
          
          <Button size="sm" className="bg-green-600 hover:bg-green-700">
            Contact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}