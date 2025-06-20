
import React from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Mail, RefreshCw } from 'lucide-react';

interface HeaderProps {
  onSignOut: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const Header = ({ onSignOut, onRefresh, refreshing }: HeaderProps) => {
  return (
    <header className="bg-gradient-to-r from-amber-100 to-orange-100 shadow-lg border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-0 sm:h-20 gap-4 sm:gap-0">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-amber-200 rounded-xl">
              <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-amber-800" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-amber-900">Corporate Communications</h1>
              <p className="text-xs sm:text-sm text-amber-700">Employee Messaging Portal</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1 sm:space-x-2 border-amber-300 text-amber-800 hover:bg-amber-100 text-sm px-3 py-2 flex-1 sm:flex-initial"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={onSignOut} 
              className="flex items-center space-x-1 sm:space-x-2 border-amber-300 text-amber-800 hover:bg-amber-100 text-sm px-3 py-2 flex-1 sm:flex-initial"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
