#!/usr/bin/perl

my $newver;

sub procfile {
    my $filename = shift;
    my $type = shift;  # 'HTML' | 'JS'
    
    open(FH, '<', $filename) or die $!;
    my $contents;
    while(<FH>) {
        if($type eq 'HTML') {
            if((!$newver) && /common.css\?([0-9]+)"/) {
                $newver = $1 + 1;
            }
            s/common.css\?([0-9]+)"/common.css?$newver"/g;
            s/common.js\?([0-9]+)"/common.js?$newver"/g;
            s/beelocal.js\?([0-9]+)"/beelocal.js?$newver"/g;
        }
        if($type eq 'JS') {
            die "no existing version found ($filename)" unless $newver;
            s/bee_app_version\s*=\s*([0-9]+)/bee_app_version = $newver/g;
        }
        $contents .= $_;
    }
    close(FH);
    open(FH, '>', $filename) or die $!;
    print FH $contents;
    close(FH);
}

procfile('count.html', 'HTML');
procfile('spellbee.html', 'HTML');
procfile('assets/common.js', 'JS');
