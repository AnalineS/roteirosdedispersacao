/**
 * @name Medical Data Validation Check
 * @description Detects potential issues with medical data validation in educational platform
 * @kind problem
 * @problem.severity warning
 * @security-severity 7.5
 * @precision medium
 * @id medical-platform/medical-validation
 * @tags security
 *       medical
 *       validation
 *       educational-platform
 */

import python
import semmle.python.dataflow.DataFlow
import semmle.python.ApiGraphs

/**
 * Detects medical calculation functions without proper input validation
 */
class MedicalCalculationFunction extends Function {
  MedicalCalculationFunction() {
    // Functions that handle medical calculations
    this.getName().matches("%dose%") or
    this.getName().matches("%medication%") or
    this.getName().matches("%calculate%") or
    this.getName().matches("%pqt%") or
    this.getName().matches("%hanseniase%")
  }
}

/**
 * Detects input validation patterns
 */
class ValidationPattern extends CallNode {
  ValidationPattern() {
    // Common validation functions
    this.getFunction().getName() = "isinstance" or
    this.getFunction().getName() = "validate" or
    this.getFunction().getName().matches("%sanitiz%") or
    this.getFunction().getName().matches("%clean%")
  }
}

/**
 * Main query: find medical functions without validation
 */
from MedicalCalculationFunction func
where
  // Function has parameters
  func.getArg(_) instanceof Name and
  // But no validation pattern found in function body
  not exists(ValidationPattern validation |
    validation.getScope() = func
  )
select func, "Medical calculation function '" + func.getName() + "' may lack proper input validation for medical data."