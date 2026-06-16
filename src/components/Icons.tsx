/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Leaf,
  Hammer,
  Truck,
  Sprout,
  MapPin,
  Check,
  X,
  Plus,
  Trash,
  Edit,
  User,
  ShoppingBag,
  Store,
  Shield,
  MessageSquare,
  Star,
  Search,
  ChevronRight,
  ChevronLeft,
  Map,
  Clock,
  Instagram,
  Phone,
  Settings,
  AlertTriangle,
  LogOut,
  Sliders,
  Sparkles,
  Award,
  Filter,
  Activity,
  Calendar,
  DollarSign,
  PlusCircle,
  Eye,
  CheckCircle,
  Compass
} from "lucide-react";

export const IconMap: Record<string, React.ComponentType<any>> = {
  Leaf,
  Hammer,
  Truck,
  Sprout,
  MapPin,
  Check,
  X,
  Plus,
  Trash,
  Edit,
  User,
  ShoppingBag,
  Store,
  Shield,
  MessageSquare,
  Star,
  Search,
  ChevronRight,
  ChevronLeft,
  Map,
  Clock,
  Instagram,
  Phone,
  Settings,
  AlertTriangle,
  LogOut,
  Sliders,
  Sparkles,
  Award,
  Filter,
  Activity,
  Calendar,
  DollarSign,
  PlusCircle,
  Eye,
  CheckCircle,
  Compass
};

export function DynamicIcon({ name, ...props }: { name: string; [key: string]: any }) {
  const IconComponent = IconMap[name] || Award;
  return <IconComponent {...props} />;
}
