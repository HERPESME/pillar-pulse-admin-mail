
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
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <div className="p-2 bg-amber-200 rounded-xl">
              <Mail className="h-8 w-8 text-amber-800" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-amber-900">Corporate Communications</h1>
              <p className="text-sm text-amber-700">Employee Messaging Portal</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline" 
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={onSignOut} 
              className="flex items-center space-x-2 border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
