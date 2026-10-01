import { Link } from 'react-router-dom';
import { Heart, Activity, Stethoscope } from 'lucide-react';

export function Home() {
  return (
    <div className="min-h-screen bg-cardio-bg">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-16 h-16 text-cardio-accent mr-4" />
            <h1 className="text-5xl font-bold text-cardio-primary">CardioTools</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Evidence-based cardiovascular risk assessment and clinical decision support tools
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Built on the latest ACC/AHA guidelines
          </p>
        </header>

        {/* Tool Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* PREVENT Calculator */}
          <Link to="/prevent-calculator" className="group">
            <div className="bg-white rounded-lg shadow-cardio-lg hover:shadow-xl transition-all duration-300 p-8 h-full border-l-4 border-cardio-secondary hover:border-cardio-primary">
              <div className="flex items-start mb-4">
                <div className="p-3 bg-cardio-secondary/10 rounded-lg group-hover:bg-cardio-secondary/20 transition-colors">
                  <Activity className="w-8 h-8 text-cardio-secondary" />
                </div>
                <div className="ml-4 flex-1">
                  <h2 className="text-2xl font-bold text-cardio-primary mb-2">
                    CV Optimization
                  </h2>
                  <p className="text-sm text-cardio-secondary font-semibold mb-3">
                    2024 AHA PREVENT Equations
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-4 leading-relaxed">
                Calculate 10-year and 30-year cardiovascular disease risk using the latest American Heart Association PREVENT equations, incorporating cardiovascular-kidney-metabolic health.
              </p>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="text-cardio-success mr-2">✓</span>
                  <span>Total CVD, ASCVD, and Heart Failure risk</span>
                </div>
                <div className="flex items-start">
                  <span className="text-cardio-success mr-2">✓</span>
                  <span>10-year and 30-year risk predictions</span>
                </div>
                <div className="flex items-start">
                  <span className="text-cardio-success mr-2">✓</span>
                  <span>Personalized treatment recommendations</span>
                </div>
                <div className="flex items-start">
                  <span className="text-cardio-success mr-2">✓</span>
                  <span>EMR-ready clinical reports</span>
                </div>
              </div>

              <div className="mt-6 flex items-center text-cardio-secondary font-semibold group-hover:text-cardio-primary transition-colors">
                <span>Open Calculator</span>
                <span className="ml-2 group-hover:ml-3 transition-all">→</span>
              </div>
            </div>
          </Link>

          {/* PreCardia */}
          <Link to="/precardia" className="group">
            <div className="bg-white rounded-lg shadow-cardio-lg hover:shadow-xl transition-all duration-300 p-8 h-full border-l-4 border-cardio-accent hover:border-cardio-primary">
              <div className="flex items-start mb-4">
                <div className="p-3 bg-cardio-accent/10 rounded-lg group-hover:bg-cardio-accent/20 transition-colors">
                  <Stethoscope className="w-8 h-8 text-cardio-accent" />
                </div>
                <div className="ml-4 flex-1">
                  <h2 className="text-2xl font-bold text-cardio-primary mb-2">
                    PreCardia
                  </h2>
                  <p className="text-sm text-cardio-accent font-semibold mb-3">
                    2026 AHA/ACC Perioperative Guideline
                  </p>
                </div>
              </div>

              <p className="text-gray-600 mb-4 leading-relaxed">
                Comprehensive pre-operative cardiac risk assessment for non-cardiac surgery using the Revised Cardiac Risk Index (RCRI) and evidence-based perioperative management recommendations.
              </p>

              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-start">
                  <span className="text-cardio-success mr-2">✓</span>
                  <span>RCRI and perioperative risk assessment</span>
                </div>
                <div className="flex items-start">
                  <span className="text-cardio-success mr-2">✓</span>
                  <span>Surgical risk stratification (low/intermediate/high)</span>
                </div>
                <div className="flex items-start">
                  <span className="text-cardio-success mr-2">✓</span>
                  <span>Functional capacity (METs) assessment</span>
                </div>
                <div className="flex items-start">
                  <span className="text-cardio-success mr-2">✓</span>
                  <span>Perioperative medication management</span>
                </div>
              </div>

              <div className="mt-6 flex items-center text-cardio-accent font-semibold group-hover:text-cardio-primary transition-colors">
                <span>Open Tool</span>
                <span className="ml-2 group-hover:ml-3 transition-all">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-gray-500">
          <p className="mb-2">
            <strong className="text-cardio-primary">Disclaimer:</strong> These tools are for clinical decision support only and should not replace clinical judgment.
          </p>
          <p>
            Always use these tools in conjunction with professional expertise and local clinical guidelines.
          </p>
        </footer>
      </div>
    </div>
  );
}
