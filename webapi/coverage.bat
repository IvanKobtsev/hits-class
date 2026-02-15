rem This is a .bat file to generate code coverage reports.
rem Download coverage.cobertura.xml files from build Artifacts (backend_coverage folder) and put it to `./cobertura` folder.
rem Then run coverage.bat and check `./cobertura/report` folder to see the coverage.
rem You could apply filters to see the coverage on separate files/classes.

dotnet reportgenerator -reports:cobertura/* -targetdir:cobertura/report -sourcedirs:./ -assemblyfilters:+Team13.HitsClass.App;+Team13.HitsClass.Common;+Team13.HitsClass.Domain
open cobertura/report/index.html
